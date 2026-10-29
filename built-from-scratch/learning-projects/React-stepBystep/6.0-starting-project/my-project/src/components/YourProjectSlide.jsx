import Button from "./Button";
import { useState, useEffect } from "react";


export default function YourProjectSlide({
  onChange,
  title,
  className,
  addedProject,
  onShow
}) {
  const [project, setProject] = useState([]);
  

  // Automatically run handleChange whenever addedProject changes
  useEffect(() => {
    if (addedProject) {
      setProject(prev => [...prev, addedProject]);
    }
  }, [addedProject]);

  

  return (
    <div className={className}>
      <Button
        className="w-full p-3 mt-2 rounded-full text-gray-800 hover:bg-indigo-200 transition shadow-md cursor-pointer"
        title={title}
        onChange={onChange}
      />
      {project.length > 0 && (
        <div className="mt-4 px-4">
          {project.map((p, index) => (
            <p key={index} className="text-red-500">
              📌 {<Button className ="w-full mt-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md cursor-pointer" title={p.title} 
              onChange = {onShow}></Button>}
            </p>
          ))}
        </div>
      )}

      <Button className ="w-full mt-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md cursor-pointer" title='click' onChange = {onShow}> </Button>

      
    </div>
  );
}

