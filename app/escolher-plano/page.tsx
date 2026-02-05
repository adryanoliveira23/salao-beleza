"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Timer, TrendingUp, Users } from "lucide-react";

export default function ChoosePlanPage() {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [paymentUrl, setPaymentUrl] = useState(
    "https://pay.cakto.com.br/4j8q5du_754033",
  );

  useEffect(() => {
    // Attempt to get user registration data to pass to Cakto
    const registrationData = localStorage.getItem("user_registration");
    if (registrationData) {
      try {
        const { email, name, salonName } = JSON.parse(registrationData);
        // Build dynamic URL with metadata
        // Note: Cakto often uses query params like ?email=...&name=...
        const baseUrl = "https://pay.cakto.com.br/4j8q5du_754033";
        const params = new URLSearchParams();
        if (email) params.append("email", email);
        if (name) params.append("name", name);
        if (salonName) params.append("metadata[salonName]", salonName);

        setPaymentUrl(`${baseUrl}?${params.toString()}`);
      } catch (e) {
        console.error("Error parsing registration data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#fff5f7] to-[#ffffff] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#FF6B9D]/10 text-[#FF6B9D] px-4 py-2 rounded-full font-bold mb-6 animate-pulse">
            <Timer size={20} />
            CONDIÇÃO ESPECIAL EXPIRA EM: {formatTime(timeLeft)}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d1b2e] mb-4">
            Escolha o melhor plano para o seu{" "}
            <span className="text-[#FF6B9D]">sucesso</span>
          </h1>
          <p className="text-[#2d1b2e]/70 text-lg">
            Aumente seu faturamento e organize sua agenda com a tecnologia líder
            do mercado.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-[#FF6B9D] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#FF6B9D] text-white px-6 py-1 rounded-bl-2xl text-sm font-bold uppercase">
              Mais Vendido
            </div>
            <h2
              className="text-2xl font-normal text-[#2d1b2e] mb-2 font-montserrat"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Agendly Glow
            </h2>
            <p className="text-[#2d1b2e]/60 mb-6 font-sans">
              Tudo o que seu salão precisa para crescer
            </p>

            <div
              className="text-5xl font-black text-[#FF6B9D] mb-6 flex items-baseline gap-1 font-montserrat tracking-tight"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              <span className="text-2xl font-sans font-medium text-[#FF6B9D]/80">
                R$
              </span>
              35,90
              <span className="text-base font-normal font-sans text-gray-400 ml-1">
                /mês
              </span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Agenda Online Inteligente",
                "Gestão Completa de Clientes",
                "Financeiro e Comissões",
                "Lembretes via WhatsApp",
                "Relatórios de Performance",
                "Suporte Premium",
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-600">
                  <CheckCircle2 size={20} className="text-[#FF6B9D]" />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href={paymentUrl}
              className="block w-full text-center bg-linear-to-r from-[#FF6B9D] to-[#C77DFF] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
            >
              ADQUIRIR AGORA
            </a>
          </div>

          <div className="space-y-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-[#FF6B9D]/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-[#FF6B9D]">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#2d1b2e]">Crescimento Real</h3>
                  <p className="text-sm text-gray-500">
                    Média de +40% no faturamento
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Salões que utilizam o Agendly Glow registram um crescimento
                significativo na retenção de clientes logo no primeiro
                trimestre.
              </p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-[#FF6B9D]/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-[#C77DFF]">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#2d1b2e]">Comunidade Ativa</h3>
                  <p className="text-sm text-gray-500">
                    Mais de 8.500 parceiros
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Junte-se a uma rede de empreendedores de sucesso que confiam sua
                gestão em nossa plataforma.
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-green-500" />{" "}
                <span className="text-sm font-medium">Cancelamento grátis</span>
                <CheckCircle2 size={16} className="text-green-500" />{" "}
                <span className="text-sm font-medium">Sem fidelidade</span>
                <CheckCircle2 size={16} className="text-green-500" />{" "}
                <span className="text-sm font-medium">Setup instantâneo</span>
              </div>
              <p className="text-xs text-gray-400">
                Após o pagamento, você receberá seus dados de acesso por e-mail
                em até 2 minutos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
