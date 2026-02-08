"use client";

import { login } from "@/lib/auth-actions";
import Image from "next/image";
import Link from "next/link";

export default function Navbar(){
    return <nav className="bg-white shadow-md py-4 border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center px-6 lg:px-8">
            <Link href={"/"} className="flex items-center">
                <Image src={"/logo_app.png"} alt="logo" width={50} height={50}/>
                <span className="text-2xl font-bold text-gray-800"> Квест Арзамас </span>
            </Link>

            <div className="flex items-center space-x-4">
                <button className="bg-gray-800 hover:bg-gray-900 text-white p-2 rounded-sm" 
                onClick={login}>
                    Войти
                </button>
            </div>
        </div>
    </nav>
}