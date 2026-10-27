"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./landing.module.css";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Calendar,
  Users,
  TrendingUp,
  Package,
  MessageCircle,
  Briefcase,
  Heart,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { DemoSection } from "@/components/LandingPage/DemoSection";
import { FAQSection } from "@/components/LandingPage/FAQSection";
import { SegmentsSection } from "@/components/LandingPage/SegmentsSection";
import { soundEffects } from "@/lib/soundEffects";

export default function LandingPage() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  // Sincronização do tema (Claro / Escuro)
  useEffect(() => {
    const isCurrentlyDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("bellamais_theme_mode") === "dark" ||
      localStorage.getItem("agendly_theme_mode") === "dark";
    setIsDark(isCurrentlyDark);
    if (isCurrentlyDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const toggleMobileMenu = () => {
    soundEffects.playClick();
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleNavClick = () => {
    soundEffects.playClick();
    setIsMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    soundEffects.playClick();
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("bellamais_theme_mode", "dark");
      localStorage.setItem("agendly_theme_mode", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("bellamais_theme_mode", "light");
      localStorage.setItem("agendly_theme_mode", "light");
    }
  };

  useEffect(() => {
    let ticking = false;
    const threshold = 18;
    const handleScroll = () => {
      if (isMobileMenuOpen) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY =
            window.pageYOffset || document.documentElement.scrollTop;

          if (currentScrollY <= 60) {
            // No topo: sempre visível
            setIsHeaderVisible(true);
          } else if (currentScrollY > lastScrollY.current + threshold) {
            // Descendo a página: esconde o header
            setIsHeaderVisible(false);
          } else if (currentScrollY < lastScrollY.current - threshold) {
            // Subindo a página: mostra o header
            setIsHeaderVisible(true);
          }

          lastScrollY.current = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileMenuOpen]);

  // Fecha menu mobile ao redimensionar para telas maiores
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScrollLink = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.getAttribute("href")?.startsWith("#")) {
        e.preventDefault();
        const id = anchor.getAttribute("href")?.substring(1);
        const element = document.getElementById(id || "");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    document.addEventListener("click", handleScrollLink);
    return () => document.removeEventListener("click", handleScrollLink);
  }, []);

  return (
    <div className={styles.landingPage}>
      {/* Navigation com auto-hide ao descer a página e alinhamento perfeito dos botões */}
      <nav
        className={`${styles.nav} ${!isHeaderVisible ? styles.navHidden : ""}`}
      >
        <div className={styles.navContainer}>
          <a href="#" className={styles.logo}>
            <div className={styles.logoBadge}>
              <Scissors size={18} />
            </div>
            <span className={styles.logoText}>BellaMais</span>
          </a>

          <ul className={styles.navLinks}>
            <li>
              <a href="#recursos">Soluções</a>
            </li>
            <li>
              <a href="#demo">Demonstração</a>
            </li>
            <li>
              <a href="#precos">Planos</a>
            </li>
            <li>
              <a href="#depoimentos">Depoimentos</a>
            </li>
          </ul>

          <div className={styles.navActions}>
            <button
              type="button"
              onClick={toggleTheme}
              className={styles.themeToggleBtn}
              title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
              aria-label="Alternar tema claro e escuro"
            >
              {isDark ? (
                <Sun size={16} className="text-amber-400 shrink-0" />
              ) : (
                <Moon size={16} className="text-purple-600 shrink-0" />
              )}
              <span className="hidden sm:inline text-xs font-semibold">
                {isDark ? "Claro" : "Escuro"}
              </span>
            </button>
            <a href="/login" className={styles.navLoginLink}>
              Entrar
            </a>
            <a
              href="#precos"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnNavCompact}`}
            >
              Começar Agora
            </a>
            <button
              type="button"
              onClick={toggleMobileMenu}
              className={styles.mobileMenuBtn}
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu de navegação"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {isMobileMenuOpen && (
          <div className={styles.mobileNavDrawer}>
            <ul className={styles.mobileNavLinks}>
              <li>
                <a href="#recursos" onClick={handleNavClick}>
                  Soluções
                </a>
              </li>
              <li>
                <a href="#demo" onClick={handleNavClick}>
                  Demonstração
                </a>
              </li>
              <li>
                <a href="#precos" onClick={handleNavClick}>
                  Planos
                </a>
              </li>
              <li>
                <a href="#depoimentos" onClick={handleNavClick}>
                  Depoimentos
                </a>
              </li>
              <li>
                <a href="#faq" onClick={handleNavClick}>
                  Dúvidas Frequentes
                </a>
              </li>
            </ul>
            <div className={styles.mobileDrawerActions}>
              <a
                href="/login"
                className={styles.mobileDrawerLoginLink}
                onClick={handleNavClick}
              >
                Entrar na Conta
              </a>
              <a
                href="#precos"
                className={`${styles.btn} ${styles.btnPrimary} ${styles.mobileDrawerCta}`}
                onClick={handleNavClick}
              >
                Começar Agora
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              <Sparkles size={14} className="text-primary shrink-0" />
              Plataforma de Gestão para Salões, Clínicas & Spas
            </span>
            <h1>
              O sistema definitivo para o seu{" "}
              <span>salão de beleza</span>
            </h1>
            <p>
              Agenda online integrada ao WhatsApp, controle financeiro em tempo
              real e cálculo automático de comissões. Organize sua rotina e
              encante suas clientes.
            </p>
            <div className={styles.heroCtaRow}>
              <div className={styles.heroCta}>
                <a
                  href="#precos"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  Começar Agora <ArrowRight size={16} className="ml-1.5" />
                </a>
                <a
                  href="#demo"
                  className={`${styles.btn} ${styles.btnWhite}`}
                >
                  Ver Demonstração
                </a>
              </div>
              <div className={styles.heroTrustBadges}>
                <span>✓ Teste grátis de 7 dias</span>
                <span>•</span>
                <span>Sem cartão de crédito</span>
                <span>•</span>
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <DemoSection />

      {/* Transformation Section */}
      <section className={styles.transformation}>
        <div className={styles.transformationContainer}>
          <h2>Tecnologia que impulsiona o seu negócio</h2>
          <p>
            Elimine as planilhas e o papel. Centralize toda a operação do seu
            salão em uma plataforma elegante, intuitiva e pensada para o seu
            crescimento.
          </p>
          <div className={styles.transformationGrid}>
            <div className={styles.transformCard}>
              <span className={styles.transformIcon}>
                <Clock size={36} className="text-[var(--primary)] dark:text-rose-400" />
              </span>
              <h3>Otimização de Tempo</h3>
              <p>
                Automatize confirmações e reduza o tempo gasto no WhatsApp em
                até 40%. Sua recepção focada no atendimento presencial.
              </p>
            </div>
            <div className={styles.transformCard}>
              <span className={styles.transformIcon}>
                <DollarSign size={36} className="text-[var(--primary)] dark:text-rose-400" />
              </span>
              <h3>Maximização de Lucro</h3>
              <p>
                Controle financeiro preciso com fluxo de caixa, despesas fixas e
                margens de lucro transparentes em tempo real.
              </p>
            </div>
            <div className={styles.transformCard}>
              <span className={styles.transformIcon}>
                <CheckCircle2 size={36} className="text-[var(--primary)] dark:text-rose-400" />
              </span>
              <h3>Redução de No-Show</h3>
              <p>
                Lembretes automáticos por WhatsApp reduzem as faltas e atrasos,
                mantendo a grade da sua equipe sempre ocupada.
              </p>
            </div>
            <div className={styles.transformCard}>
              <span className={styles.transformIcon}>
                <Heart size={36} className="text-[var(--primary)] dark:text-rose-400" />
              </span>
              <h3>Fidelização de Clientes</h3>
              <p>
                Histórico completo, fichas de anamnese, mimos de aniversário e
                pontuação de retorno para manter suas clientes fiéis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="recursos">
        <div className={styles.featuresContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Recursos Essenciais</span>
            <h2>
              Gestão completa para
              <br />
              profissionais da beleza
            </h2>
            <p>
              Do agendamento ao pós-venda, cada ferramenta foi desenhada para a
              rotina prática de salões, manicures, maquiadoras, esteticistas e spas.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {[
              {
                icon: <Calendar size={28} />,
                title: "Agenda Inteligente",
                desc: "Visualização diária, semanal e mensal com filtros por profissional, bloqueios de folga e prevenção de duplicidades.",
              },
              {
                icon: <Users size={28} />,
                title: "Cadastro & Ficha de Clientes",
                desc: "Histórico completo de atendimentos, preferências de serviços, fórmulas capilares e consentimento LGPD.",
              },
              {
                icon: <TrendingUp size={28} />,
                title: "Financeiro & Caixa",
                desc: "Registro de receitas, despesas fixas, fechamento de caixa diário e relatórios de lucratividade real.",
              },
              {
                icon: <Briefcase size={28} />,
                title: "Equipe & Comissões",
                desc: "Cálculo automático de comissões por serviço e relatórios claros para repasses justos às colaboradoras.",
              },
              {
                icon: <Package size={28} />,
                title: "Estoque & Produtos",
                desc: "Controle de insumos utilizados em bancada e cosméticos para revenda, com alertas de reposição mínima.",
              },
              {
                icon: <MessageCircle size={28} />,
                title: "WhatsApp & Agendamento Online",
                desc: "Link próprio para a bio do Instagram e envio de lembretes automáticos diretamente para as clientes.",
              },
            ].map((feature, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials} id="depoimentos">
        <div className={styles.testimonialsContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Depoimentos Reais</span>
            <h2>Salões que confiam na plataforma</h2>
            <p>
              Veja como profissionais da beleza transformaram a organização do seu dia a dia
            </p>
          </div>
          <div className={styles.testimonialsGrid}>
            {[
              {
                text: "A BellaMais organizou completamente o meu espaço. O cálculo de comissão que antes levava horas no fim do mês agora é feito em minutos e sem nenhum erro.",
                author: "Mariana Costa",
                salon: "Studio Bella Vista",
                initials: "MC",
              },
              {
                text: "Minhas clientes adoram a facilidade de agendar direto pelo link no Instagram e os lembretes no WhatsApp diminuíram drasticamente as faltas de sexta e sábado.",
                author: "Patricia Silva",
                salon: "Espaço P&S Hair",
                initials: "PS",
              },
              {
                text: "A plataforma é muito fácil de usar no celular. Consigo ver o financeiro, os custos e o lucro real do salão de qualquer lugar sem precisar de computador.",
                author: "Juliana Almeida",
                salon: "Glamour Estética & Spa",
                initials: "JA",
              },
            ].map((testimonial, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.stars}>★★★★★</div>
                <p className={styles.testimonialText}>
                  &quot;{testimonial.text}&quot;
                </p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.authorAvatar}>
                    {testimonial.initials}
                  </div>
                  <div className={styles.authorInfo}>
                    <h4>{testimonial.author}</h4>
                    <p>{testimonial.salon}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segments Section */}
      <SegmentsSection />

      {/* Pricing */}
      <section className={styles.pricing} id="precos">
        <div className={styles.pricingContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Planos Transparentes</span>
            <h2>
              Investimento pensado para
              <br />
              o crescimento do seu salão
            </h2>
            <p>Sem taxas escondidas, sem contratos abusivos. Cancele quando quiser.</p>
          </div>
          <div className="flex justify-center px-4">
            <div
              className={`${styles.pricingCard} ${styles.featured} max-w-sm w-full`}
            >
              <span className={styles.popularBadge}>
                Mais Escolhido por Donas de Salão
              </span>
              <h3>Plano Profissional</h3>
              <div className={styles.price}>
                <span>R$</span>
                35,90
                <span>/mês</span>
              </div>
              <span className={styles.period}>
                Tudo o que seu salão precisa em um só lugar
              </span>
              <ul className={styles.pricingFeatures}>
                <li>Agenda Online Completa</li>
                <li>Cadastro Ilimitado de Clientes</li>
                <li>Gestão Financeira & Comissões</li>
                <li>Lembretes via WhatsApp</li>
                <li>Página Própria de Agendamento</li>
                <li>Suporte Rápido e Humanizado</li>
              </ul>
              <a
                href="/register"
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{
                  width: "100%",
                  textAlign: "center",
                  marginTop: "2rem",
                }}
              >
                Criar Minha Conta
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Final */}
      <section className={styles.ctaFinal}>
        <div className={styles.ctaContainer}>
          <h2>
            Leve seu salão para o
            <br />
            próximo nível
          </h2>
          <p>Comece a organizar sua agenda e financeiro hoje mesmo.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto">
            <a href="/register" className={`${styles.btn} ${styles.btnPrimary} w-full sm:w-auto`}>
              Começar Gratuitamente
            </a>
            <a href="/login" className={`${styles.btn} ${styles.btnWhite} w-full sm:w-auto`}>
              Acessar Minha Conta
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <h3>BellaMais</h3>
            <p>
              Software profissional desenvolvido especialmente para salões de beleza,
              esteticistas, cabeleireiras, manicures e maquiadoras autônomas.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <h4>Plataforma</h4>
            <ul>
              <li>
                <a href="#recursos">Funcionalidades</a>
              </li>
              <li>
                <a href="#demo">Demonstração</a>
              </li>
              <li>
                <a href="#precos">Planos & Preços</a>
              </li>
              <li>
                <a href="#depoimentos">Casos de Uso</a>
              </li>
            </ul>
          </div>
          <div className={styles.footerLinks}>
            <h4>Suporte</h4>
            <ul>
              <li>
                <a
                  href="https://wa.me/556699762785?text=Olá!%20Gostaria%20de%20tirar%20dúvidas%20sobre%20o%20BellaMais"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Suporte pelo WhatsApp
                </a>
              </li>
              <li>
                <a href="/login">Área da Cliente</a>
              </li>
              <li>
                <a href="/admin/login">Portal Administrativo</a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>
            © {new Date().getFullYear()} BellaMais. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Botão Flutuante Direto do WhatsApp (Sem simulação de robô/IA) */}
      <a
        href="https://wa.me/556699762785?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20o%20sistema%20BellaMais."
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappFloat}
        title="Fale Conosco pelo WhatsApp"
      >
        <MessageCircle size={30} />
      </a>
    </div>
  );
}
