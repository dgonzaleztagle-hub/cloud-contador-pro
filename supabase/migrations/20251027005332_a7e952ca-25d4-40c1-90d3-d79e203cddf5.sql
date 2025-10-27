-- Drop the recursive triggers that are causing infinite loop
DROP TRIGGER IF EXISTS sync_f29_to_honorarios_trigger ON f29_declarations;
DROP TRIGGER IF EXISTS sync_honorarios_to_f29_trigger ON honorarios;

-- Drop the functions as well since they cause recursion
DROP FUNCTION IF EXISTS public.sync_f29_to_honorarios();
DROP FUNCTION IF EXISTS public.sync_honorarios_to_f29();