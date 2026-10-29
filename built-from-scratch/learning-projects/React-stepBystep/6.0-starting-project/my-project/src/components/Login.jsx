import Input from "./Input";
import Button from "./Button";
import picture from "../assets/picture.png";

export default function Login({ onChange }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-indigo-200 to-gray-950">
            {/* MAIN WRAPPER */}
            <div className="flex items-center justify-around w-[1000px] h-[500px] rounded-[32px] overflow-hidden shadow-2xl ">

                {/* LEFT GRADIENT PANEL */}
                <div className="flex flex-col justify-center px-16 text-white">
                    <div className="w-20 h-20 object-contain mb-4"><img src={picture}></img></div>
                    <p className="text-sm font-semibold opacity-90 mb-6">NOTE-BOOK</p>

                    <h1 className="text-5xl font-bold mb-6">Hey, Hello!</h1>

                    <p className="text-lg font-medium opacity-90 mb-4">
                        Join The NoteBook For Better Experience
                    </p>

                    <p className="text-sm opacity-100 leading-relaxed max-w-md text-center text-indigo-950">
                        “We provide all the tools and features that make organizing, writing, and managing your notes effortless—everything you need in one place.”
                    </p>
                </div>

                {/* RIGHT WHITE CARD (no extra wrapper div) */}

                <div className="bg-white flex flex-col items-center w-[380px] h-150 bg-amber-40 mx-8 rounded-3xl p-6 shadow-2xl">

                    <h2 className=" flex justify-center text-3xl font-bold text-slate-900 mb-2 text-center">
                        Welcome Back
                    </h2>

                    <p className="flex justify-center text-sm text-slate-500 mb-8 text-center">
                        Let’s get started with your 30 days free trial.
                    </p>

                    <div className="flex flex-col w-full gap-5">
                        <Input label="Username" type="text" />
                        <Input label="Password" type="password" />
                    </div>

                    <p className="text-sm text-indigo-60 mt-3 cursor-pointer">
                        Forgot Password?
                    </p>

                    <Button
                        title="Login"
                        onChange={onChange}
                        className="w-full mt-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md cursor-pointer"
                    />


                    <span className="text-sm text-slate-400 m-4">OR</span>

                    <p className="text-sm text-center text-slate-600">
                        Don’t have an account?{" "}
                        <span className="text-indigo-600 font-semibold cursor-pointer">
                            Sign Up
                        </span>
                    </p>
                </div>


            </div>
        </div>
    );
}
