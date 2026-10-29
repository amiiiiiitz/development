import NewProject from "./components/NewProject.jsx";
import NoProjectSelected from "./components/NoProjectSelected.jsx";
import ProjectsSideBar from "./components/ProjectsSidebar.jsx";
import { useState } from "react";
import SelectedProject from "./components/SelectedProject.jsx";

function App() {
    const [projectsState, setProjectsState] = useState({
        selectedProjectID: undefined,
        projects: [],
        tasks: [],
    });
    function handleAddTask(text) {
        setProjectsState((prev) => {
            const taskId = Math.random();
            const newTask = {
                text: text,
                projectId: prev.selectedProjectID,
                id: taskId,
            };
            return {
                ...prev,
                tasks: [newTask, ...prev.tasks],
            };
        });
    }

    function handleDeleteTask(id) {
        setProjectsState((prev) => {
            return {
                ...prev,
                tasks: prev.tasks.filter((task) => task.id !== id),
            };
        });
    }

    function handleSelectProject(id) {
        setProjectsState((prev) => {
            return {
                ...prev,
                selectedProjectID: id,
            };
        });
    }
    function handleStartAddproject() {
        setProjectsState((prev) => {
            return {
                ...prev,
                selectedProjectID: null,
            };
        });
    }

    function handleCancelAddProject() {
        setProjectsState((prev) => {
            return {
                ...prev,
                selectedProjectID: undefined,
            };
        });
    }

    function handleAddProject(projectsData) {
        setProjectsState((prev) => {
            const projectId = Math.random();
            const newProjects = {
                ...projectsData,
                id: projectId,
            };
            return {
                ...prev,
                selectedProjectID: undefined,
                projects: [...prev.projects, newProjects],
            };
        });
    }

    function handleDeleteProject() {
        setProjectsState((prev) => {
            return {
                ...prev,
                selectedProjectID: null,
                projects: prev.projects.filter(
                    (project) => project.id !== prev.selectedProjectID,
                ),
            };
        });
    }

    const selectedProject = projectsState.projects.find(
        (project) => project.id === projectsState.selectedProjectID,
    );

    let content = (
        <SelectedProject
            project={selectedProject}
            onDelete={handleDeleteProject}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            tasks={projectsState.tasks}
        />
    );

    if (projectsState.selectedProjectID === null) {
        content = (
            <NewProject
                onAdd={handleAddProject}
                onCancel={handleCancelAddProject}
            />
        );
    } else if (projectsState.selectedProjectID === undefined) {
        content = (
            <NoProjectSelected onStartAddproject={handleStartAddproject} />
        );
    }
    return (
        <main className="h-screen  flex gap-8">
            <ProjectsSideBar
                onStartAddproject={handleStartAddproject}
                projects={projectsState.projects}
                onSelectProject={handleSelectProject}
                selectProjectId={projectsState.selectedProjectID}
            />
            {content}
            {/* <NewProject /> */}
        </main>
    );
}

export default App;
