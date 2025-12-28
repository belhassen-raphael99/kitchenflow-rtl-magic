-- Promote existing user to admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'fc4fac07-809d-4306-be66-672d9d803ead';