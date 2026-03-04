export const cpfToEmail = (cpf: string) => { 
  const digits = cpf.replace(/\D/g, ''); 
  return `${digits}@login.tavarescar.com.br`; 
};
