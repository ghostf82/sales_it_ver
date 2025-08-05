/*
  # تحديث سياسات وصول قواعد العمولات
  
  1. التغييرات
    - حذف السياسات القديمة
    - إنشاء سياسات جديدة مع التحقق المناسب من المشرفين
    - إضافة تريجر للتعامل مع حقول updated_by و updated_at
    - تحسين التحقق من صلاحيات المشرف
    
  2. الأمان
    - تفعيل RLS
    - السماح بالقراءة لجميع المستخدمين المصادق عليهم
    - تقييد عمليات التعديل للمشرفين فقط
*/

-- فعّل RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

-- احذف السياسات القديمة
DROP POLICY IF EXISTS read_commission_rules ON commission_rules;
DROP POLICY IF EXISTS insert_commission_rules ON commission_rules;
DROP POLICY IF EXISTS update_commission_rules ON commission_rules;
DROP POLICY IF EXISTS delete_commission_rules ON commission_rules;

-- سياسة القراءة: أي مستخدم مصادق عليه
CREATE POLICY read_commission_rules
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (true);

-- سياسة الإدخال: فقط للمشرفين
CREATE POLICY insert_commission_rules
  ON commission_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- سياسة التعديل: فقط للمشرفين
CREATE POLICY update_commission_rules
  ON commission_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- سياسة الحذف: فقط للمشرفين
CREATE POLICY delete_commission_rules
  ON commission_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- احذف التريجر والدالة السابقة
DROP TRIGGER IF EXISTS set_updated_by ON commission_rules;
DROP FUNCTION IF EXISTS handle_updated_by CASCADE;

-- دالة للتحقق من صلاحيات المشرف وتحديث البيانات
CREATE OR REPLACE FUNCTION handle_updated_by()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- احصل على معرف المستخدم الحالي
  v_user_id := auth.uid();
  
  -- تحقق من صلاحيات المشرف
  SELECT is_admin INTO v_is_admin
  FROM admin_users
  WHERE id = v_user_id;
  
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'فقط المشرفين يمكنهم تعديل قواعد العمولات';
  END IF;
  
  -- تحديث حقول updated_by و updated_at
  NEW.updated_by := v_user_id;
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- إنشاء التريجر
CREATE TRIGGER set_updated_by
  BEFORE INSERT OR UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_by();