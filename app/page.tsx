"use client";

import React, { useEffect } from "react";
import styles from "./landing.module.css";
import {
  Sparkles,
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
} from "lucide-react";

export default function LandingPage() {
  useEffect(() => {
    const handleScrollLink = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" &&
        target.getAttribute("href")?.startsWith("#")
      ) {
        e.preventDefault();
        const id = target.getAttribute("href")?.substring(1);
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
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <Sparkles size={24} />
            Agendly Glow
          </div>
          <ul className={styles.navLinks}>
            <li>
              <a href="#recursos">Soluções</a>
            </li>
            <li>
              <a href="#precos">Planos</a>
            </li>
            <li>
              <a href="#depoimentos">Cases de Sucesso</a>
            </li>
            <li>
              <a href="/login" className={styles.btnNav}>
                Área do Cliente
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              ✨ Software nº 1 para Salões de Beleza e Spas
            </span>
            <h1>
              Eleve o nível do seu
              <br />
              <span className={styles.gradientText}>salão de beleza</span>
            </h1>
            <p>
              Gestão inteligente que une agendamento, financeiro e marketing em
              uma experiência premium. Deixe a tecnologia cuidar da rotina
              enquanto você cuida da beleza dos seus clientes.
            </p>
            <div className={styles.heroCtaRow}>
              <div className={styles.heroCta}>
                <a
                  href="/login"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  Área do Cliente
                </a>
              </div>
              <div className={styles.heroStatsCarousel}>
                <div className={styles.heroStatsTrack}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>+8.5k</span>
                    <span className={styles.statLabel}>Salões Parceiros</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>99%</span>
                    <span className={styles.statLabel}>Aprovação</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>+1.2M</span>
                    <span className={styles.statLabel}>Agendamentos/mês</span>
                  </div>
                  {/* Duplicados para loop infinito */}
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>+8.5k</span>
                    <span className={styles.statLabel}>Salões Parceiros</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>99%</span>
                    <span className={styles.statLabel}>Aprovação</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>+1.2M</span>
                    <span className={styles.statLabel}>Agendamentos/mês</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.dashboardMock}>
              <div className={styles.dashHeader}>
                <div className={styles.dashTitle}>Visão Geral do Negócio</div>
                <div className={styles.dashTime}>Atualizado em tempo real</div>
              </div>
              <div className={styles.metricsGrid}>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Faturamento Diário</div>
                  <div className={styles.metricValue}>R$ 2.845,90</div>
                  <div className={styles.metricTrend}>↗ +28% meta diária</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Agendamentos</div>
                  <div className={styles.metricValue}>23</div>
                  <div className={styles.metricTrend}>↗ 8 para confirmar</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Ticket Médio</div>
                  <div className={styles.metricValue}>R$ 185,50</div>
                  <div className={styles.metricTrend}>↗ +12% este mês</div>
                </div>
                <div className={styles.metricBox}>
                  <div className={styles.metricLabel}>Retenção</div>
                  <div className={styles.metricValue}>85%</div>
                  <div className={styles.metricTrend}>↗ Clientes fiéis</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transformation Section */}
      <section className={styles.transformation}>
        <div className={styles.transformationContainer}>
          <h2>Tecnologia que impulsiona beleza</h2>
          <p>
            Elimine as planilhas e o papel. Centralize toda a operação do seu
            salão em uma plataforma elegante, intuitiva e pensada para o seu
            crescimento.
          </p>
          <div className={styles.transformationGrid}>
            <div className={styles.transformCard}>
              <span className={styles.transformIcon}>
                <Clock size={40} className="text-[#FF6B9D]" />
              </span>
              <h3>Otimização de Tempo</h3>
              <p>
                Automatize confirmações e reduza o tempo gasto no WhatsApp em
                até 40%. Sua recepção focada no atendimento presencial.
              </p>
            </div>
            <div className={styles.transformCard}>
              <span className={styles.transformIcon}>
                <DollarSign size={40} className="text-[#FF6B9D]" />
              </span>
              <h3>Maximização de Lucro</h3>
              <p>
                Ferramentas de upselling e controle financeiro preciso que
                identificam oportunidades de receita e reduzem desperdícios.
              </p>
            </div>
            <div className={styles.transformCard}>
              <span className={styles.transformIcon}>
                <CheckCircle2 size={40} className="text-[#FF6B9D]" />
              </span>
              <h3>Redução de No-Show</h3>
              <p>
                Lembretes automáticos inteligentes reduzem as faltas em até 80%,
                mantendo sua agenda sempre produtiva.
              </p>
            </div>
            <div className={styles.transformCard}>
              <span className={styles.transformIcon}>
                <Heart size={40} className="text-[#FF6B9D]" />
              </span>
              <h3>Fidelização Premium</h3>
              <p>
                Programa de fidelidade integrado que encanta clientes e aumenta
                a recorrência dos seus serviços.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features} id="recursos">
        <div className={styles.featuresContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Recursos Profissionais</span>
            <h2>
              Gestão completa para
              <br />
              negócios de beleza
            </h2>
            <p>
              Do agendamento ao pós-venda, cada ferramenta foi desenhada para a
              realidade de salões, esmalterias, barbearias e spas.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {[
              {
                icon: <Calendar size={32} />,
                title: "Agenda Inteligente",
                desc: "Gestão multi-profissional com visualização intuitiva, bloqueios, recorrências e lista de espera.",
              },
              {
                icon: <Users size={32} />,
                title: "Gestão de Clientes (CRM)",
                desc: "Histórico completo de atendimentos, galeria de fotos antes/depois, preferências e anamnese.",
              },
              {
                icon: <TrendingUp size={32} />,
                title: "Financeiro Completo",
                desc: "Fluxo de caixa, DRE, conciliação bancária, split de pagamentos e cálculo automático de comissões.",
              },
              {
                icon: <Briefcase size={32} />,
                title: "Gestão de Equipe",
                desc: "Controle de escalas, permissões personalizadas, metas individuais e relatórios de performance.",
              },
              {
                icon: <Package size={32} />,
                title: "Controle de Estoque",
                desc: "Gestão de produtos de revenda e consumo interno, com alertas de reposição e ficha técnica.",
              },
              {
                icon: <MessageCircle size={32} />,
                title: "Marketing Automatizado",
                desc: "Campanhas de aniversário, recuperação de inativos e promoções via WhatsApp e E-mail.",
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
            <span className={styles.sectionBadge}>Quem usa, ama</span>
            <h2>Histórias de Sucesso</h2>
            <p>
              Junte-se a milhares de empreendedoras que transformaram seus
              negócios
            </p>
          </div>
          <div className={styles.testimonialsGrid}>
            {[
              {
                text: "A Agendly Glow profissionalizou completamente meu salão. O controle financeiro me deu a clareza que eu precisava para expandir para a segunda unidade.",
                author: "Mariana Costa",
                salon: "CEO, Salão Bella Vista",
                initials: "MC",
              },
              {
                text: "Meus clientes amam a facilidade de agendar online e receber os lembretes. Minha equipe está mais feliz com a transparência das comissões.",
                author: "Patricia Silva",
                salon: "Proprietária, Studio P&S",
                initials: "PS",
              },
              {
                text: "O suporte é incrível e a plataforma não para de evoluir. O módulo de marketing pagou o sistema no primeiro mês trazendo clientes sumidos de volta.",
                author: "Juliana Almeida",
                salon: "Diretora, Glamour Hair Spa",
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

      {/* Pricing */}
      <section className={styles.pricing} id="precos">
        <div className={styles.pricingContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>
              Investimento Inteligente
            </span>
            <h2>
              Planos que crescem
              <br />
              com você
            </h2>
            <p>Transparência total. Sem taxas de setup ou fidelidade.</p>
          </div>
          <div className="flex justify-center">
            <div
              className={`${styles.pricingCard} ${styles.featured} max-w-sm w-full`}
            >
              <span className={styles.popularBadge}>
                O Melhor Custo-Benefício
              </span>
              <h3>Essencial</h3>
              <div className={styles.price}>
                <span
                  style={{
                    fontSize: "1.5rem",
                    verticalAlign: "top",
                    marginTop: "10px",
                    display: "inline-block",
                  }}
                >
                  R$
                </span>
                48,79
                <span>/mês</span>
              </div>
              <span className={styles.period}>
                O plano completo para o seu sucesso
              </span>
              <ul className={styles.pricingFeatures}>
                <li>Agenda Online Inteligente</li>
                <li>Gestão Completa de Clientes</li>
                <li>Financeiro e Comissões</li>
                <li>Lembretes via WhatsApp</li>
                <li>Relatórios de Performance</li>
                <li>Suporte Premium</li>
              </ul>
              <a
                href="https://pay.cakto.com.br/4j8q5du_754033"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{
                  width: "100%",
                  textAlign: "center",
                  marginTop: "2rem",
                }}
              >
                Começar Agora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.ctaFinal}>
        <div className={styles.ctaContainer}>
          <h2>
            Sua história de sucesso
            <br />
            começa aqui
          </h2>
          <p>Entre em contato com nossa equipe para cadastrar seu salão.</p>
          <a href="/login" className={`${styles.btn} ${styles.btnWhite}`}>
            Área do Cliente
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <h3>Agendly Glow</h3>
            <p>
              Tecnologia e beleza caminhando juntas. Desenvolvemos soluções que
              empoderam empreendedores e transformam a gestão de salões.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <h4>Plataforma</h4>
            <ul>
              <li>
                <a href="#">Funcionalidades</a>
              </li>
              <li>
                <a href="#">Para Salões</a>
              </li>
              <li>
                <a href="#">Para Barbearias</a>
              </li>
              <li>
                <a href="#">Para Spas</a>
              </li>
            </ul>
          </div>
          <div className={styles.footerLinks}>
            <h4>Empresa</h4>
            <ul>
              <li>
                <a href="#">Sobre Nós</a>
              </li>
              <li>
                <a href="#">Carreiras</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
              <li>
                <a href="#">Imprensa</a>
              </li>
            </ul>
          </div>
          <div className={styles.footerLinks}>
            <h4>Suporte</h4>
            <ul>
              <li>
                <a href="#">Central de Ajuda</a>
              </li>
              <li>
                <a href="#">Tutoriais</a>
              </li>
              <li>
                <a
                  href="https://wa.me/556699762785?text=Olá,preciso%20de%20ajuda%20com%20a%20Agendly%20Glow"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contato (WhatsApp)
                </a>
              </li>
              <li>
                <a href="#">Status</a>
              </li>
            </ul>
          </div>
          <div className={styles.footerLinks}>
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="#">Termos de Uso</a>
              </li>
              <li>
                <a href="#">Privacidade</a>
              </li>
              <li>
                <a href="#">Compliance</a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>
            © 2026 Agendly Glow Tecnologia Ltda. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/556699762785?text=Olá,preciso%20de%20ajuda%20com%20a%20Agendly%20Glow"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappFloat}
        title="Fale conosco no WhatsApp"
      >
        <MessageCircle size={32} />
      </a>
    </div>
  );
}
