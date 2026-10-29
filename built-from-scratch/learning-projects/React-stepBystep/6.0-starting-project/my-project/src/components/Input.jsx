export default function Input({ label, type, onChange }) {
  return (
    <>
      <label className="mt-2 ml-2 ">{label}</label>
      <input
        type={type}
        className="w-full rounded-3xl border border-b-cyan-950 px-2 py-2 mr-2 ml-2"
        onChange = {onChange}
      />
    </>
  );
}
