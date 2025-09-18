-- Migration: Add triggers for automatic client balance updates
-- File: 0017_client_balance_triggers.sql

-- Fatura eklendiğinde veya güncellendiğinde client balance'ı otomatik güncelle
CREATE OR REPLACE FUNCTION update_client_balance_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer fatura bir client'a bağlıysa
    IF NEW.client_id IS NOT NULL THEN
        -- Client'ın toplam bakiyesini hesapla
        UPDATE clients 
        SET balance = (
            SELECT COALESCE(SUM(remaining_amount), 0)
            FROM invoices 
            WHERE client_id = NEW.client_id 
            AND status IN ('pending', 'overdue')
        )
        WHERE id = NEW.client_id;
    END IF;
    
    -- Eski fatura farklı bir client'a bağlıysa onu da güncelle (UPDATE durumunda)
    IF TG_OP = 'UPDATE' AND OLD.client_id IS NOT NULL AND OLD.client_id != NEW.client_id THEN
        UPDATE clients 
        SET balance = (
            SELECT COALESCE(SUM(remaining_amount), 0)
            FROM invoices 
            WHERE client_id = OLD.client_id 
            AND status IN ('pending', 'overdue')
        )
        WHERE id = OLD.client_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fatura silindiğinde client balance'ı güncelle
CREATE OR REPLACE FUNCTION update_client_balance_on_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer silinen fatura bir client'a bağlıysa
    IF OLD.client_id IS NOT NULL THEN
        UPDATE clients 
        SET balance = (
            SELECT COALESCE(SUM(remaining_amount), 0)
            FROM invoices 
            WHERE client_id = OLD.client_id 
            AND status IN ('pending', 'overdue')
        )
        WHERE id = OLD.client_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggerları oluştur
DROP TRIGGER IF EXISTS trigger_update_client_balance_on_invoice ON invoices;
DROP TRIGGER IF EXISTS trigger_update_client_balance_on_invoice_delete ON invoices;

CREATE TRIGGER trigger_update_client_balance_on_invoice
    AFTER INSERT OR UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_client_balance_on_invoice();

CREATE TRIGGER trigger_update_client_balance_on_invoice_delete
    AFTER DELETE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_client_balance_on_invoice_delete();

-- Tekrarlayan faturalar için fonksiyon
CREATE OR REPLACE FUNCTION process_recurring_invoices()
RETURNS void AS $$
DECLARE
    invoice_rec RECORD;
    next_issue_date DATE;
    next_due_date DATE;
    new_invoice_number TEXT;
BEGIN
    -- Tekrarlayan faturaları bul (recurringMonths > 0 ve issue_date bugün veya geçmişte)
    FOR invoice_rec IN 
        SELECT * FROM invoices 
        WHERE is_recurring = true 
        AND recurring_months > 0 
        AND issue_date <= CURRENT_DATE
    LOOP
        -- Yeni tarihler hesapla
        next_issue_date := invoice_rec.issue_date + INTERVAL '1 month';
        next_due_date := invoice_rec.due_date + INTERVAL '1 month';
        
        -- Yeni fatura numarası oluştur (eğer varsa)
        IF invoice_rec.invoice_number IS NOT NULL THEN
            new_invoice_number := invoice_rec.invoice_number || '-' || (invoice_rec.recurring_months)::text;
        ELSE
            new_invoice_number := NULL;
        END IF;
        
        -- Yeni fatura oluştur
        INSERT INTO invoices (
            user_id, client_id, currency_id, issue_date, due_date,
            invoice_number, description, items, vat_rate,
            net_amount, total_amount, paid_amount, remaining_amount,
            status, is_recurring, recurring_months
        ) VALUES (
            invoice_rec.user_id, invoice_rec.client_id, invoice_rec.currency_id,
            next_issue_date, next_due_date, new_invoice_number,
            invoice_rec.description, invoice_rec.items, invoice_rec.vat_rate,
            invoice_rec.net_amount, invoice_rec.total_amount, 0, invoice_rec.total_amount,
            'pending', false, null
        );
        
        -- Orijinal faturanın tekrar sayısını azalt
        UPDATE invoices 
        SET recurring_months = recurring_months - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = invoice_rec.id;
        
        -- Eğer tekrar sayısı 0 olduysa recurring'i kapat
        IF invoice_rec.recurring_months - 1 <= 0 THEN
            UPDATE invoices 
            SET is_recurring = false,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = invoice_rec.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Tekrarlayan regular_payments için fonksiyon
CREATE OR REPLACE FUNCTION process_recurring_payments()
RETURNS void AS $$
DECLARE
    payment_rec RECORD;
    next_due_date DATE;
BEGIN
    -- Vadesi geçmiş pending ödemeleri bul
    FOR payment_rec IN 
        SELECT * FROM regular_payments 
        WHERE status = 'pending' 
        AND due_date <= CURRENT_DATE
    LOOP
        -- Transaction oluştur
        INSERT INTO transactions (
            type, amount, description, currency_id, transaction_date,
            employee_id, user_id, is_vat_included, vat_rate,
            is_recurring, recurring_period
        ) VALUES (
            'expense',
            payment_rec.amount,
            payment_rec.title || ' - Düzenli Ödeme',
            payment_rec.currency_id,
            payment_rec.due_date,
            payment_rec.employee_id,
            payment_rec.user_id,
            false,
            0,
            false,
            null
        );
        
        -- Bir sonraki ödeme tarihini hesapla
        CASE payment_rec.frequency
            WHEN 'weekly' THEN
                next_due_date := payment_rec.due_date + INTERVAL '1 week';
            WHEN 'biweekly' THEN
                next_due_date := payment_rec.due_date + INTERVAL '2 weeks';
            WHEN 'monthly' THEN
                next_due_date := payment_rec.due_date + INTERVAL '1 month';
            WHEN 'quarterly' THEN
                next_due_date := payment_rec.due_date + INTERVAL '3 months';
            WHEN 'yearly' THEN
                next_due_date := payment_rec.due_date + INTERVAL '1 year';
            ELSE
                next_due_date := payment_rec.due_date + INTERVAL '1 month';
        END CASE;
        
        -- Regular payment'ın due_date'ini güncelle
        UPDATE regular_payments 
        SET due_date = next_due_date,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = payment_rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Tekrarlayan transactions için fonksiyon
CREATE OR REPLACE FUNCTION process_recurring_transactions()
RETURNS void AS $$
DECLARE
    trans_rec RECORD;
    next_recurring_date DATE;
BEGIN
    -- Tekrarlayan transaction'ları bul (next_recurring_date bugün veya geçmişte)
    FOR trans_rec IN 
        SELECT * FROM transactions 
        WHERE is_recurring = true 
        AND next_recurring_date IS NOT NULL
        AND next_recurring_date <= CURRENT_DATE
    LOOP
        -- Yeni transaction oluştur
        INSERT INTO transactions (
            type, amount, description, category_id, client_id, employee_id,
            currency_id, transaction_date, is_vat_included, vat_rate,
            is_recurring, parent_transaction_id, user_id
        ) VALUES (
            trans_rec.type,
            trans_rec.amount,
            COALESCE(trans_rec.description, '') || ' (Tekrar)',
            trans_rec.category_id,
            trans_rec.client_id,
            trans_rec.employee_id,
            trans_rec.currency_id,
            trans_rec.next_recurring_date,
            trans_rec.is_vat_included,
            trans_rec.vat_rate,
            false,
            trans_rec.id,
            trans_rec.user_id
        );
        
        -- Bir sonraki tekrar tarihini hesapla
        CASE trans_rec.recurring_period
            WHEN 'weekly' THEN
                next_recurring_date := trans_rec.next_recurring_date + INTERVAL '1 week';
            WHEN 'monthly' THEN
                next_recurring_date := trans_rec.next_recurring_date + INTERVAL '1 month';
            WHEN 'quarterly' THEN
                next_recurring_date := trans_rec.next_recurring_date + INTERVAL '3 months';
            WHEN 'yearly' THEN
                next_recurring_date := trans_rec.next_recurring_date + INTERVAL '1 year';
            ELSE
                next_recurring_date := trans_rec.next_recurring_date + INTERVAL '1 month';
        END CASE;
        
        -- Parent transaction'ın next_recurring_date'ini güncelle
        UPDATE transactions 
        SET next_recurring_date = next_recurring_date,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = trans_rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_client_balance_on_invoice() IS 'Fatura değişikliklerinde client bakiyesini otomatik günceller';
COMMENT ON FUNCTION process_recurring_invoices() IS 'Tekrarlayan faturaları işler ve yeni örnekler oluşturur';
COMMENT ON FUNCTION process_recurring_payments() IS 'Vadesi geçmiş düzenli ödemeleri işler';
COMMENT ON FUNCTION process_recurring_transactions() IS 'Tekrarlayan işlemleri işler ve yeni örnekler oluşturur';
