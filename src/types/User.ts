export interface UserProfile {
  uid: string;
  nombre: string;
  email: string;
  empresa: string;
  puesto: string;
  rol: 'operario' | 'supervisor' | 'instructor' | 'administrador';
  activo: boolean;
  fechaRegistro: number;
}
