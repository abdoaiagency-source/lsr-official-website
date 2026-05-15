import { contact, reasons, sectors, services, workflow } from "@/lib/content";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

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
            <a href="#sectors">القطاعات</a>
            <a href="#contact">تواصل معنا</a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <SectionLabel>شركة ليبية متخصصة في شؤون العمالة الوافدة</SectionLabel>
            <h1>حلول متكاملة لإدارة شؤون العمالة الوافدة في ليبيا</h1>
            <p className="lead">
              شركة الإقامة الآمنة الليبية للخدمات العمالية تساعد الشركات والمؤسسات على تنظيم ملفات العمالة الأجنبية، من الاستقدام والإقامات والعقود إلى الامتثال والمتابعة والدعم اللوجستي، باحترافية وسرية والتزام بالقانون.
            </p>
            <div className="hero-actions">
              <a className="btn primary" href={`mailto:${contact.email}`}>تواصل معنا</a>
              <a className="btn secondary" href="#services">استعرض خدماتنا</a>
            </div>
            <div className="hero-proof" aria-label="مؤشرات الثقة">
              <span>تنظيم قانوني</span>
              <span>متابعة مستمرة</span>
              <span>قطاعات تشغيل حقيقية</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="بطاقات خدمات الإقامة الآمنة">
            <div className="glass-card main-card">
              <span>ملف عمالي منظم</span>
              <strong>من الاحتياج إلى الاستقرار</strong>
              <p>دراسة، مطابقة، امتثال، ومتابعة حتى اكتمال الإجراءات.</p>
            </div>
            <div className="floating-card one">الإقامات والعقود</div>
            <div className="floating-card two">استقدام العمالة</div>
            <div className="floating-card three">منصة وافد والامتثال</div>
          </div>
        </div>
      </section>

      <section className="intro section">
        <div>
          <SectionLabel>من نحن؟</SectionLabel>
          <h2>نتحمل مسؤولية الملف العمالي من بدايته حتى اكتماله</h2>
        </div>
        <p>
          نحن شركة ليبية متخصصة في تقديم حلول متكاملة لإدارة شؤون العمالة الأجنبية الماهرة، مع التركيز على التنظيم القانوني الكامل، حماية مصالح أصحاب الأعمال، والمساهمة في استقرار سوق العمل الليبي. في الإقامة الآمنة، لا نقدّم خدمة فقط؛ بل نتابع الملف العمالي باحترافية وسرية والتزام تام بالقانون.
        </p>
      </section>

      <section className="section" id="services">
        <SectionLabel>خدماتنا</SectionLabel>
        <div className="section-head">
          <h2>كل ما تحتاجه الشركة لتنظيم العمالة والإقامات والمتابعة</h2>
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

      <section className="workflow section">
        <SectionLabel>آلية العمل</SectionLabel>
        <h2>مسار واضح يحوّل الاحتياج إلى ملف قابل للمتابعة</h2>
        <div className="workflow-line">
          {workflow.map((item, index) => (
            <div className="workflow-step" key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section sectors" id="sectors">
        <div className="section-head light">
          <SectionLabel>القطاعات التي نخدمها</SectionLabel>
          <h2>كوادر متخصصة لقطاعات تشغيل حقيقية</h2>
          <p>الصحة، الفنادق، التعليم، المصانع، البناء، التكنولوجيا، والزراعة.</p>
        </div>
        <div className="sector-grid">
          {sectors.map((sector) => <div className="sector-pill" key={sector}>{sector}</div>)}
        </div>
      </section>

      <section className="section why">
        <div className="section-head">
          <SectionLabel>لماذا الإقامة الآمنة؟</SectionLabel>
          <h2>وضوح إجرائي، متابعة مستمرة، والتزام دون مجازفة</h2>
        </div>
        <div className="why-grid">
          {reasons.map((reason) => <div className="reason" key={reason}>{reason}</div>)}
        </div>
      </section>

      <section className="contact section" id="contact">
        <div>
          <SectionLabel>تواصل معنا</SectionLabel>
          <h2>ابدأ بتنظيم احتياجك العمالي مع فريق الإقامة الآمنة</h2>
          <p>أرسل لنا تفاصيل القطاع والوظائف المطلوبة وسنساعدك على تحديد الخطوات المناسبة.</p>
        </div>
        <div className="contact-card">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <span>{contact.address}</span>
          {contact.phones.map((phone) => <a key={phone} href={`tel:${phone}`}>{phone}</a>)}
        </div>
      </section>

      <footer>
        <span>© 2026 شركة الإقامة الآمنة الليبية للخدمات العمالية</span>
        <span>معنا خطوة بخطوة نحو الأمان</span>
      </footer>
    </main>
  );
}
