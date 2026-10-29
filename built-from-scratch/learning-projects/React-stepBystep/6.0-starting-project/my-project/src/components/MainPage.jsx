import Button from "./Button";
import { useState } from "react";
import YourProjectSlide from "./YourProjectSlide";
import picture from "../assets/picture.png";
import Portal from "./portal";
import CreateProject from "./CreateProject";
import ProjectDetails from "./ProjectDetails";
import { useRef } from "react";

export default function MainPage({ title }) {
  const [show, setshow] = useState(false);
  
  const [addProject, setAddProject] = useState(false);

  const [addedProject, setAddedProject] = useState({});

  const [projectDetails, setProjectDetails] = useState(false);
  
  // function handleShowDetails() {
  //   setProjectDetails(!projectDetails);
 
  // }

  function handleSave(projectData) {
    console.log(projectData);
    setAddedProject(projectData);
    setAddProject(false);
  }
  function handleChangeMain() {
    setshow(!show);
  }
  function handleChangeProject() {
    setAddProject(!addProject);
  }
  return (
    <>
      <div className="min-h-screen flex flex-row">

        {(!show || !addProject) &&
          <section className="flex justify-center items-center bg-amber-400 min-h-screen min-w-screen">
            <div className="bg-white flex flex-col items-center  w-[380px] h-150 bg-amber-40 rounded-3xl p-6 shadow-2x">

              <div className="w-40 h-40 object-contain mb-2"><img src={picture} /></div>

              <p className="text-2xl">selected</p>

              <h2 className="font-semibold">Select a project or get started with new one</h2>

              <Button className="w-full mt-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md cursor-pointer" onChange={handleChangeMain} title={title} />
            </div>

          </section>
        }

        {/* YourProjectSlide overlay using Portal */}
        {show && (
          <Portal>
            <YourProjectSlide
                className="fixed inset-y-0 left-0 min-h-screen w-[300px] z-50 bg-white shadow-2xl"
                onChange={handleChangeProject}
                title="Add Project"
                addedProject= {addedProject}
              />
          </Portal>
        )}

        {/* Add Project placeholder using Portal */}
        {addProject && (
          <Portal>
            <CreateProject onSave={handleSave} />
          </Portal>
        )}

        {projectDetails &&(
          <Portal>
            <ProjectDetails onShow = {handleShowDetails}></ProjectDetails>
          </Portal>
          )}
      </div>
    </>
  );
}
