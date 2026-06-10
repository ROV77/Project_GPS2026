/** Estilos base compartidos por los controles de formulario (Input, Textarea, etc.). */
export const controlBase =
  'w-full rounded-lg border bg-white px-3 font-sans text-sm text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ' +
  'disabled:bg-slate-50 disabled:text-slate-500';

export const controlBorder = (invalid?: boolean): string =>
  invalid ? 'border-red-400' : 'border-slate-300';
