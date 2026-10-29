// export default function Button ({onChange, title, className, ref}) {
//     return <button className = {className} onClick = {onChange} ref={ref}>{title}</button>
// }
export default function Button({ onChange, title, className }) {
  return (
    <button className={className} onClick={onChange}>
      {title}
    </button>
  );
}

