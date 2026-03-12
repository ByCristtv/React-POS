import { supabase } from "./supabase.config";

export async function RegistrarCuentaPorCobrar(p) {
  const { error } = await supabase.rpc("registrar_cuenta_por_cobrar", p);
  if (error) {
    throw new Error(error.message);
  }
}

export async function AbonarCuentaPorCobrar(p) {
  const { error } = await supabase.rpc("abonar_cuenta_por_cobrar", p);
  if (error) {
    throw new Error(error.message);
  }
}

export async function MostrarCuentasPorCobrar(p) {
  const { data, error } = await supabase.rpc("mostrar_cuentas_por_cobrar", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function MostrarMovimientosCxc(p) {
  const { data, error } = await supabase.rpc("mostrar_movimientos_cxc", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
