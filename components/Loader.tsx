type LoaderProps = {
  label?: string;
};

export default function Loader({ label = "Cargando..." }: LoaderProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-600">
      <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-neutral-700" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
