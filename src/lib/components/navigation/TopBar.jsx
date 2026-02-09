import React from "react";
import avatar from "../../../assets/avatar.svg";

export function TopBar({ user }) {
  // Default user jika tidak ada prop user
  const displayUser = user || {
    name: "User",
    role: "Guest",
  };

  return (
    <header className="flex justify-between items-center w-full border-b-2 border-disable-hover  p-2">
      <div className="text-border ml-5">
        <h1 className="text-3xl">Hello, {displayUser.name}</h1>
        <h2 className="text-xl">{displayUser.role}</h2>
      </div>

      <div className="flex items-center mr-5">
        <div>
          <img src={avatar} alt="Profile" className="" />
        </div>
      </div>
    </header>
  );
}
