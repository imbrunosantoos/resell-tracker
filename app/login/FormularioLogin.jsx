"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdioma } from "@/app/components/Idioma";

export default function FormularioLogin({ modoInicial }) {
  const router = useRouter();
  const { t } = useIdioma();
  const [modo, setModo] = useState(modoInicial); // "entrar" | "registar"
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [aEnviar, setAEnviar] = useState(false);

  const registar = modo === "registar";

  async function submeter(e) {
    e.preventDefault();
    setErro("");
    setAEnviar(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, password, modo }),
      });
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro || t("login.erroGenerico"));
      router.replace("/");
      router.refresh();
    } catch (err) {
      setErro(err.message);
      setAEnviar(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-cartao">
        <h1>ReSell<span className="ponto">.</span></h1>
        <span className="tagline">{t("login.tagline")}</span>

        <form className="campos" onSubmit={submeter}>
          <label className="campo">
            <span>{t("login.utilizador")}</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label className="campo">
            <span>{t("login.password")}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={registar ? "new-password" : "current-password"}
              required
            />
          </label>

          <button className="btn primario" type="submit" disabled={aEnviar}>
            {aEnviar ? t("login.aEntrar") : registar ? t("login.criarConta") : t("login.entrar")}
          </button>
        </form>

        {erro && <p className="login-erro">{erro}</p>}

        <p className="login-troca">
          {registar ? t("login.jaTens") : t("login.aindaNao")}{" "}
          <button
            type="button"
            onClick={() => { setModo(registar ? "entrar" : "registar"); setErro(""); }}
          >
            {registar ? t("login.entrar") : t("login.criarConta")}
          </button>
        </p>
      </div>
    </div>
  );
}
