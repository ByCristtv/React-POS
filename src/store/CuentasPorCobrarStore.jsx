import { create } from "zustand";
import {
  MostrarCuentasPorCobrar,
  AbonarCuentaPorCobrar,
  RegistrarCuentaPorCobrar,
  MostrarMovimientosCxc
} from "../supabase/crudCuentasPorCobrar";

export const useCuentasPorCobrarStore = create((set) => ({
  dataCuentasPorCobrar: [],

  mostrarCuentasPorCobrar: async (p) => {
    const response = await MostrarCuentasPorCobrar(p);
    set({ dataCuentasPorCobrar: response });
    return response;
  },

  abonarCuentaPorCobrar: async (p) => {
    await AbonarCuentaPorCobrar(p);
  },

  registrarCuentaPorCobrar: async (p) => {
    await RegistrarCuentaPorCobrar(p);
  },

  mostrarMovimientosCxc: async (p) => {
    const response = await MostrarMovimientosCxc(p);
    return response;
  },

}));