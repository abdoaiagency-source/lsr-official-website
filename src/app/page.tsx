import { contact, reasons, sectors, services, workflow } from "@/lib/content";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

const proofItems = ["ملفات منظمة", "متابعة قانونية", "قطاعات تشغيل فعلية"];

export default function Home() {
  return (
    <main>
      <section className="hero" id="top">
        <nav className="nav" aria-label="التنقل الرئيسي">
          <a className="brand" href="#top" aria-label="الإقامة الآمنة الرئيسية">
            <span className="brand-mark">LSR</span>
            <span>
              <strong>الإقامة الآمنة</strong>
              <small>للخدمات العمالية</small>
            </span>
          </a>
          <div className="nav-links">
            <a href="#services">الخدمات</a>
            <a href="#process">المنهجية</a>
            <a href="#sectors">القطاعات</a>
            <a className="nav-cta" href="#contact">تواصل معنا</a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <SectionLabel>شركة ليبية متخصصة في شؤون العمالة الوافدة</SectionLabel>
            <h1>إدارة نظامية للعمالة الوافدة، من الاحتياج حتى استقرار التشغيل.</h1>
            <p className="lead">
              الإقامة الآمنة تساعد الشركات والمؤسسات في ليبيا على تنظيم الاستقدام، الإقامات، العقود، المتابعة، والدعم اللوجستي بمنهجية واضحة وسرية مهنية والتزام بالإجراءات المعتمدة.
            </p>
            <div className="hero-actions">
              <a className="btn primary" href={`mailto:${contact.email}`}>ابدأ بمراجعة احتياجك</a>
              <a className="btn secondary" href="#services">استعرض نطاق الخدمات</a>
            </div>
            <div className="hero-proof" aria-label="مؤشرات الثقة">
              {proofItems.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>

          <aside className="hero-panel" aria-label="ملخص منهجية الإقامة الآمنة">
            <div className="panel-topline">
              <span>ملف عمالي منظم</span>
              <strong>LSR</strong>
            </div>
            <h2>منهجية تشغيل تحفظ الوقت وتقلل المخاطر.</h2>
            <div className="panel-metrics" aria-label="مؤشرات الخدمة">
              <div>
                <strong>01</strong>
                <span>دراسة الاحتياج</span>
              </div>
              <div>
                <strong>02</strong>
                <span>مطابقة الكوادر</span>
              </div>
              <div>
                <strong>03</strong>
                <span>متابعة الإجراء</span>
              </div>
            </div>
            <ol className="panel-steps">
              {workflow.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
            </ol>
          </aside>
        </div>
      </section>

      <section className="intro section">
        <div>
          <SectionLabel>من نحن؟</SectionLabel>
          <h2>شريك تشغيلي للملف العمالي، لا مجرد وسيط إجراءات.</h2>
        </div>
        <p>
          نحن شركة ليبية متخصصة في تقديم حلول متكاملة لإدارة شؤون العمالة الأجنبية الماهرة، مع التركيز على التنظيم القانوني الكامل، حماية مصالح أصحاب الأعمال، والمساهمة في استقرار سوق العمل الليبي. في الإقامة الآمنة، لا نقدّم خدمة فقط؛ بل نتابع الملف العمالي باحترافية وسرية والتزام تام بالقانون.
        </p>
      </section>

      <section className="section services-section" id="services">
        <SectionLabel>خدماتنا</SectionLabel>
        <div className="section-head">
          <h2>نطاق خدمات واضح للشركات التي تحتاج عمالة مستقرة ومنظمة.</h2>
          <p>خدمات مأخوذة من ملف الشركة الرسمي، مصاغة للويب بدون مبالغة أو وعود قانونية غير مؤكدة.</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service.title}>
              <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="process section" id="process">
        <div className="process-copy">
          <SectionLabel>آلية العمل</SectionLabel>
          <h2>مسار مختصر، قابل للمتابعة، ومبني على وضوح المسؤوليات.</h2>
          <p>نبدأ بفهم احتياج الجهة الطالبة، ثم نرتب المتطلبات والكوادر والإجراءات حتى يصبح الملف قابلاً للإدارة والمتابعة.</p>
        </div>
        <div className="process-list">
          {workflow.map((item, index) => (
            <article className="process-step" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section sectors" id="sectors">
        <div className="section-head light">
          <SectionLabel>القطاعات التي نخدمها</SectionLabel>
          <h2>كوادر متخصصة لقطاعات تشغيل حقيقية.</h2>
          <p>نخدم قطاعات تحتاج انتظاماً في العمالة، وضوحاً في المتابعة، وخفضاً للمخاطر التشغيلية.</p>
        </div>
        <div className="sector-grid">
          {sectors.map((sector) => <div className="sector-pill" key={sector}>{sector}</div>)}
        </div>
      </section>

      <section className="section why">
        <div className="section-head">
          <SectionLabel>لماذا الإقامة الآمنة؟</SectionLabel>
          <h2>قرار أفضل عندما يكون الملف واضحاً من اليوم الأول.</h2>
        </div>
        <div className="why-grid">
          {reasons.map((reason) => <div className="reason" key={reason}>{reason}</div>)}
        </div>
      </section>

      <section className="contact section" id="contact">
        <div>
          <SectionLabel>تواصل معنا</SectionLabel>
          <h2>ابدأ بتنظيم احتياجك العمالي مع فريق الإقامة الآمنة.</h2>
          <p>أرسل تفاصيل القطاع، عدد العمالة، والوظائف المطلوبة. سنراجع الطلب ونوضح الخطوة المناسبة دون وعود غير مؤكدة.</p>
        </div>
        <address className="contact-card">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <span>{contact.address}</span>
          {contact.phones.map((phone) => <a key={phone} href={`tel:${phone}`}>{phone}</a>)}
        </address>
      </section>

      <footer>
        <span>© 2026 شركة الإقامة الآمنة الليبية للخدمات العمالية</span>
        <span>معنا خطوة بخطوة نحو الأمان</span>
      </footer>
    </main>
  );
}
