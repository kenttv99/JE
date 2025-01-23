export default function InfoItem({ label, value }: { 
  label: string;
  value: string | number | boolean | null | undefined 
}) {
  return (
    <div className="mb-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">
        {value !== null && value !== undefined ? value.toString() : 'Не указано'}
      </dd>
    </div>
  );
}