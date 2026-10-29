import Button from "./Button";
import Input from "./Input";
import { useState } from "react";
import { useRef } from "react";

export default function CreateProject({ onSave }) {
  const project = useRef({
    title: "",
    description: "",
    dueDate: ""
  });

  function handleChange(field, event) {
    project.current[field] = event.target.value;
  }

  function handleSaveClick() {
    onSave(project.current);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="bg-white flex flex-col w-[500px] shadow-2xl rounded-2xl gap-6 p-10">

        <div className="flex justify-end gap-4">
          <Button title="Cancel" />
          <Button title="Save" onChange={handleSaveClick} />
        </div>

        <Input
          label="TITLE"
          name="title"
          onChange={(e) => handleChange("title", e)}
        />

        <Input 
          label="Description" 
          name="description" 
          onChange={(e) => handleChange("description", e)} 
        />
        <Input 
          label="DUE DATE" 
          name="dueDate" type="date" 
          onChange={(e) => handleChange("dueDate", e)}
        />

      </div>
    </div>
  );
}
// const { name, value } = e.target;
    // setProject(prev => ({
    //   ...prev,
    //   [name]: value
    // }));