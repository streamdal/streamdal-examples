import React, { useState } from "react";
import Layout from "../components/Layout";
import Router from "next/router";

const Create: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const body = { name, email };
      await fetch(`/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await Router.push("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <div>
        <form onSubmit={submitData}>
          <h1 className="mb-2">New User</h1>
          <div>
            <input
              className="p-2 mr-2 border rounded"
              autoFocus
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              type="text"
              value={name}
            />
            <input
              className="p-2 border rounded"
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="text"
              value={email}
            />
          </div>
          <input className={`mt-2 p-2 border rounded ${name && email ? "cursor-pointer" : "cursor-not-allowed"} `}
                 disabled={!name || !email} type="submit" value="Create"/>
        </form>
      </div>
    </Layout>
  );
};

export default Create;
