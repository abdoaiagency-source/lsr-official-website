import { contact, intakeChecklist, sectors, services, trustPrinciples, workflow } from "@/lib/content";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

function SectionHeader({
  label,
  title,
  text,
  light = false,
}: {
  label: string;
  title: string;
  text?: string;
  light?: boolean;
}) {
  return (
    <div className={`section-head${light ? " light" : ""}`}>
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h2>{title}</h2>
      </div>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

const heroProof = ["ملف عمالي واضح", "متابعة محافظة قانونياً", "جاهزية للتشغيل"];

export default function Home() {
  const featuredService = services[0];
  const supportingServices = services.slice(1);

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
              الإقامة الآمنة تنظم ملفات الاستقدام، الإقامات، العقود، والمتابعة التشغيلية للشركات في ليبيا بمنهجية واضحة، تواصل محافظ، والتزام بالإجراءات المعتمدة.
            </p>
            <div className="hero-actions">
              <a className="btn primary" href={`mailto:${contact.email}`}>ابدأ بمراجعة احتياجك</a>
              <a className="btn secondary" href="#process">افهم آلية العمل</a>
            </div>
            <div className="hero-proof" aria-label="مؤشرات الثقة">
              {heroProof.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>

          <aside className="hero-panel" aria-label="ملخص منهجية الإقامة الآمنة">
            <div className="panel-topline">
              <span>نموذج متابعة</span>
              <strong>LSR</strong>
            </div>
            <h2>كل ملف يبدأ بتحديد واضح للاحتياج، المتطلبات، والمسؤوليات.</h2>
            <div className="panel-ledger" aria-label="مكونات الملف العمالي">
              <div><span>الجهة الطالبة</span><strong>شركة / مؤسسة</strong></div>
              <div><span>نطاق الملف</span><strong>إقامة، عقد، تشغيل</strong></div>
              <div><span>طريقة المتابعة</span><strong>حالة ونواقص وخطوة تالية</strong></div>
            </div>
            <ol className="panel-steps">
              {workflow.slice(0, 3).map((item) => <li key={item.title}>{item.title}</li>)}
            </ol>
          </aside>
        </div>
      </section>

      <section className="intro section">
        <div>
          <SectionLabel>من نحن؟</SectionLabel>
          <h2>شريك تشغيلي للملف العمالي، لا مجرد وسيط إجراءات.</h2>
        </div>
        <div className="intro-copy">
          <p>
            نحن شركة ليبية متخصصة في تقديم حلول متكاملة لإدارة شؤون العمالة الأجنبية الماهرة، مع التركيز على التنظيم القانوني الكامل، حماية مصالح أصحاب الأعمال، والمساهمة في استقرار سوق العمل الليبي.
          </p>
          <p>
            في الإقامة الآمنة، لا نقدّم خدمة منفصلة عن الواقع التشغيلي؛ بل نتابع الملف العمالي كمسار له متطلبات، نواقص، تواصل، ومسؤوليات واضحة.
          </p>
        </div>
      </section>

      <section className="section services-section" id="services">
        <SectionHeader
          label="نطاق الخدمات"
          title="خدمات عمالية منظمة للشركات التي تحتاج وضوحاً قبل السرعة."
          text="نعرض نطاق العمل بلغة مباشرة: ماذا نرتب، ماذا نتابع، وما الخطر التشغيلي الذي نقلله دون مبالغة أو وعود غير مؤكدة."
        />
        <div className="service-composition">
          <article className="service-featured">
            <span className="card-number">01</span>
            <h3>{featuredService.title}</h3>
            <p>{featuredService.text}</p>
            <div className="scope-list" aria-label="نطاق الخدمة">
              {featuredService.scope.map((item) => <span key={item}>{item}</span>)}
            </div>
            <div className="risk-note">
              <small>تقليل المخاطر</small>
              <strong>{featuredService.riskReduced}</strong>
            </div>
          </article>

          <div className="services-list">
            {supportingServices.map((service, index) => (
              <article className="service-row" key={service.title}>
                <span className="service-index">{String(index + 2).padStart(2, "0")}</span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                  <div className="mini-scope">
                    {service.scope.map((item) => <span key={item}>{item}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="process section" id="process">
        <div className="process-copy">
          <SectionLabel>آلية العمل</SectionLabel>
          <h2>مسار قابل للمتابعة بدل انتظار مفتوح.</h2>
          <p>نحوّل الطلب من فكرة عامة إلى ملف واضح: احتياج، مستندات، كوادر، إجراء، ثم متابعة تشغيلية.</p>
          <div className="process-note">
            <strong>ما الذي نثبته في كل مرحلة؟</strong>
            <span>الحالة الحالية، النواقص، الطرف المسؤول، والخطوة التالية.</span>
          </div>
        </div>
        <div className="timeline">
          {workflow.map((item, index) => (
            <article className="timeline-step" key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section sectors" id="sectors">
        <SectionHeader
          light
          label="القطاعات التي نخدمها"
          title="قطاعات تحتاج انتظاماً في العمالة، لا حلولاً عشوائية."
          text="تختلف حساسية الملف حسب القطاع؛ لذلك نبدأ دائماً بفهم طبيعة التشغيل والموقع والمهارة المطلوبة."
        />
        <div className="sector-matrix">
          {sectors.map((sector, index) => (
            <div className="sector-cell" key={sector}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{sector}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section trust">
        <SectionHeader
          label="لماذا الإقامة الآمنة؟"
          title="الثقة هنا ليست شعاراً؛ هي طريقة إدارة للملف."
          text="الملفات العمالية الحساسة تحتاج هدوءاً، توثيقاً، وتواصلاً واضحاً أكثر من حاجتها لعبارات تسويقية كبيرة."
        />
        <div className="trust-grid">
          {trustPrinciples.map((principle) => (
            <article className="trust-card" key={principle.title}>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact section" id="contact">
        <div className="contact-copy">
          <SectionLabel>تواصل معنا</SectionLabel>
          <h2>ابدأ بتنظيم احتياجك العمالي بملف واضح من الرسالة الأولى.</h2>
          <p>أرسل معلومات مختصرة عن احتياجك، وسنراجع المسار المناسب ونوضح الخطوة التالية بلغة مباشرة ومحافظة.</p>
          <ul className="intake-list" aria-label="معلومات مفيدة قبل التواصل">
            {intakeChecklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <address className="contact-card">
          <span className="contact-card-title">بيانات التواصل الرسمية</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <span>{contact.address}</span>
          {contact.phones.map((phone) => <a key={phone} href={`tel:${phone}`}>{phone}</a>)}
        </address>
      </section>

      <footer>
        <div>
          <strong>شركة الإقامة الآمنة الليبية للخدمات العمالية</strong>
          <span>معنا خطوة بخطوة نحو الأمان</span>
        </div>
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
      </footer>
    </main>
  );
}
