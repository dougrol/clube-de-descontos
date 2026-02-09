-- Helper function to decrease product stock
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION decrease_product_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - p_quantity
  WHERE id = p_product_id
    AND stock >= p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
