"use strict";

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  TableBorders,
  VerticalAlign,
} = require("./node_modules/docx");

const fs = require("fs");
const path = require("path");

const OUTPUT_PATH = "Z:\\Pool\\Buffer\\Docs\\SWA_Bilingual_Revenue_Methodology.docx";

// ─── Helpers ────────────────────────────────────────────────────────────────

const NONE_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

const noBorders = {
  top: NONE_BORDER,
  bottom: NONE_BORDER,
  left: NONE_BORDER,
  right: NONE_BORDER,
  insideHorizontal: NONE_BORDER,
  insideVertical: NONE_BORDER,
};

/** Arabic paragraph – right column */
function arPara(text, opts = {}) {
  const runs = [];
  if (opts.bold && !opts.mono) {
    runs.push(
      new TextRun({
        text,
        bold: true,
        font: "Traditional Arabic",
        size: opts.size || 24, // 12pt for headings
        rtl: true,
      })
    );
  } else if (opts.mono) {
    runs.push(
      new TextRun({
        text,
        font: "Courier New",
        size: 18,
        rtl: true,
      })
    );
  } else {
    runs.push(
      new TextRun({
        text,
        font: "Traditional Arabic",
        size: 22, // 11pt
        rtl: true,
      })
    );
  }
  return new Paragraph({
    children: runs,
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: { after: opts.noSpacing ? 0 : 100 },
  });
}

/** English paragraph – left column */
function enPara(text, opts = {}) {
  const runs = [];
  if (opts.bold && !opts.mono) {
    runs.push(
      new TextRun({
        text,
        bold: true,
        font: "Calibri",
        size: opts.size || 22, // 11pt for headings
      })
    );
  } else if (opts.mono) {
    runs.push(
      new TextRun({
        text,
        font: "Courier New",
        size: 18,
      })
    );
  } else {
    runs.push(
      new TextRun({
        text,
        font: "Calibri",
        size: 20, // 10pt
      })
    );
  }
  return new Paragraph({
    children: runs,
    alignment: AlignmentType.LEFT,
    spacing: { after: opts.noSpacing ? 0 : 100 },
  });
}

/** Build a two-column borderless row: [Arabic right | English left] */
function row(arText, enText, opts = {}) {
  return new TableRow({
    children: [
      new TableCell({
        children: [arPara(arText, opts)],
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: noBorders,
        verticalAlign: VerticalAlign.TOP,
      }),
      new TableCell({
        children: [enPara(enText, opts)],
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: noBorders,
        verticalAlign: VerticalAlign.TOP,
      }),
    ],
  });
}

/** Heading row – bold, slightly larger */
function headRow(arText, enText) {
  return row(arText, enText, { bold: true, size: 24 });
}

/** Formula row – monospace */
function formulaRow(arText, enText) {
  return row(arText, enText, { mono: true });
}

/** Empty spacer row */
function spacerRow() {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
        borders: noBorders,
        columnSpan: 2,
      }),
    ],
  });
}

// ─── Content rows ───────────────────────────────────────────────────────────

const tableRows = [

  // ── COVER ──────────────────────────────────────────────────────────────────
  row(
    "إطار منهجية تحديد متطلب الإيراد\nقطاع المياه في المملكة العربية السعودية\n22 يوليو 2024",
    "Framework of Revenue Requirement Determination Methodology\nWater Sector in the Kingdom of Saudi Arabia\n22 July 2024",
    { bold: true, size: 28 }
  ),
  spacerRow(),
  row(
    "سجل المراجعات: التاريخ: يُحدَّد لاحقاً | الإصدار: 1.0 | الملخص: الإصدار الأولي لإطار منهجية تحديد متطلب الإيراد لقطاع المياه في المملكة العربية السعودية",
    "Revision History: Date: TBD | Version: 1.0 | Summary: Initial publication defining the framework of revenue requirement determination for the KSA water sector",
    {}
  ),
  spacerRow(),

  // ── SECTION 1 ──────────────────────────────────────────────────────────────
  headRow("1. المقدمة", "1. INTRODUCTION"),
  row(
    "يهدف هذا المستند إلى تحديد إطار منهجية تحديد متطلب الإيراد المعتمدة لدى هيئة المياه السعودية لاحتساب الإيراد المسموح به لجهات قطاع المياه الخاضعة للتنظيم في المملكة العربية السعودية. وبموجب نظام المياه، يتعين على الهيئة اعتماد التعرفات المتعلقة بتقديم خدمات المياه، مع مراعاة مبدأ ترشيد المياه والاستدامة، وتوفير الحوافز لتعزيز الكفاءة وجودة الخدمة، واشتراط تمكين الجهات الكفؤة في القطاع من استرداد تكاليفها وتحقيق عائد معقول على استثماراتها، والأحوال الاقتصادية للأسر محدودة الدخل. وتُعدّ تنظيم إيرادات مزودي خدمات المياه في المملكة إحدى الآليات التي تعتمدها الهيئة للوفاء بهذا الواجب. ويحدد هذا المستند نهج الهيئة في تأسيس المستوى المناسب من الإيرادات لتغطية التكاليف الاقتصادية المتكبَّدة بكفاءة.",
    "The purpose of this document is to set out the SWA's framework of revenue requirement determination methodology for calculating the permitted required revenue for regulated water sector entities in the Kingdom of Saudi Arabia. According to the Water Law, SWA must approve tariffs related to water service delivery, considering the principle of water conservation and sustainability, the provision of incentives to enhance efficiency and service quality, the requirement to enable efficient sector entities to recover their costs and make a reasonable return on their investment, and the economic conditions of low-income households. One mechanism used by SWA to meet this duty is the regulation of revenue of water service providers in the Kingdom. This document sets out the SWA's approach to establishing the appropriate level of revenue to cover economic and efficiently incurred costs.",
    {}
  ),
  spacerRow(),

  headRow("1-1 الغرض من متطلب الإيراد", "1.1 PURPOSE OF THE REVENUE REQUIREMENT"),
  row(
    "تتسم مزودات خدمات المياه بخصائص الاحتكار الطبيعي، إذ يكون من الأكثر كفاءةً أن تُقدِّم الخدمة المطلوبة شركةٌ واحدة. ويعود ذلك إلى عدة عوامل، أبرزها: حاجز الدخول إلى السوق الناجم عن ضخامة تكاليف الاستثمار اللازمة لإقامة البنية التحتية، وما يتيحه توسّع الاستخدام من وفورات الحجم. غير أنه في غياب المنافسة، لا يكون لمزود الخدمة حافزٌ يُذكر لخفض أسعاره أو تحسين خدماته. ومن ثَمّ، يغدو التدخل التنظيمي ضرورة حتمية للحدّ من ارتفاع التكاليف فوق المستويات الكفؤة، أو تراجع معايير الخدمة دون المستويات المقبولة.",
    "Water service providers have characteristics of natural monopolies in that it is more efficient for the desired service to be provided by a single company. This is driven by several factors, in particular the market entry barrier presented by the large investment cost of establishing the infrastructure and the substantial economies of scale from increasing use of this infrastructure. However, in the absence of competition, the service provider has little or no incentive to reduce its price or improve its services. As a result, regulatory intervention is required to discourage costs from rising above efficient levels, or service standards from falling below acceptable levels.",
    {}
  ),
  row(
    "ينبغي أن تُحقق المنهجية المعتمدة لتحديد متطلب إيراد مزود خدمات المياه توازناً بين حماية المستفيدين من التكاليف غير الكفؤة والمفرطة، وضمان قدرة الشركات على استرداد الإيراد اللازم لتمويل أنشطتها المرخصة، وفق مستويات كفاءة مُحددة مسبقاً. وتتضمن المنهجية متغيرات تُستمد من الأسواق التنافسية كتكلفة التمويل، مما يُسهم في جعل التنظيم بديلاً عن المنافسة. كما تستلزم المنهجية توافر معايير جودة خدمة لمنع مزودي خدمات المياه من خفض التكاليف عن طريق تخفيض مستويات الخدمة.",
    "The methodology used to establish a water service provider's revenue requirement must achieve a balance between protecting customers from inefficient and excessive costs and ensuring that companies are able to recover the revenue required to finance their licensed activities, subject to them operating at pre-determined levels of efficiency. The methodology incorporates variables determined through competitive markets, such as the cost of financing, in the calculations. This helps to ensure that regulation acts as a proxy for competition. Quality of service standards are also required to prevent water service providers from reducing costs by reducing levels of service.",
    {}
  ),
  row(
    "صُمِّمت منهجية تحديد متطلب الإيراد لتحقيق المبادئ التنظيمية الآتية:",
    "The revenue requirement determination methodology has been developed to meet the following regulatory principles:",
    {}
  ),
  row(
    "• العدالة: ينبغي أن يطمئن المستفيدون (الحاليون والمستقبليون) إلى أن الأسعار التي يدفعونها تعكس التكاليف الفعلية. ويجب أن يقترن ذلك بثقة الشركات المنظَّمة ومستثمريها في حصولهم على عائد مناسب على التكاليف المتكبَّدة بكفاءة في تقديم الخدمات.",
    "• Fairness: Customers (present and future) should be confident that the prices they pay are cost reflective. This should be balanced with regulated companies', and their investors', confidence that they will earn an appropriate return on costs that are efficiently incurred in the provision of services to customers.",
    {}
  ),
  row(
    "• المساءلة: تُخضع هيئة المياه السعودية الشركات المنظَّمة للمساءلة. وتكون جميع الأطراف مسؤولة أمام المستفيدين عن التكاليف المتكبَّدة والخدمات المقدَّمة والتحسينات المخططة.",
    "• Accountability: SWA holds regulated companies accountable. All parties are accountable to customers for costs incurred, services provided and planned improvements.",
    {}
  ),
  row(
    "• المصداقية: ينبغي أن يكون جميع الأطراف المعنيين مرتاحين للمنهجية المعتمدة لاحتساب متطلبات الإيراد، وللدقة والموثوقية في البيانات الأساسية.",
    "• Credibility: All interested parties should be comfortable with the methodology for calculating revenue requirements and the accuracy and reliability of the underlying data.",
    {}
  ),
  row(
    "• الشفافية: ينبغي أن تكون المتطلبات والمنهجية والمبادئ الحاكمة لاحتساب متطلب الإيراد المنظَّم محددةً بوضوح ومتَّبَعةً باستمرار.",
    "• Transparency: The requirements, methodology and principles governing the calculation of the regulated revenue requirement should be clearly established and followed.",
    {}
  ),
  row(
    "• المنهجية: ينبغي أن يكون المستفيدون والشركات المنظَّمة والمستثمرون على دراية واضحة بآلية تطبيق العملية وكيفية تطورها المتوقع بمرور الوقت.",
    "• Systematicity: Customers, the regulated companies, and investors should be clear on how the process will be implemented and how it is expected to evolve over time.",
    {}
  ),
  spacerRow(),

  headRow("1-2 التحول نحو التبني الكامل لمتطلب الإيراد", "1.2 TRANSITION TO FULLY ADOPTING THE REVENUE REQUIREMENT"),
  row(
    "لا يزال عدد محدود فقط من جهات قطاع المياه في المملكة يمتلك متطلب إيراداً في الوقت الراهن. وبالنسبة لهذه الجهات، تعكس أسعار نقل المياه نفقات التشغيل حصراً، في حين تستمر نفقات رأس المال في التمويل المباشر من وزارة المالية ضمن الميزانية السنوية. أما سائر الجهات فتُموَّل كلياً من وزارة المالية، سواء على صعيد نفقات التشغيل أو رأس المال. وفيما يخص المستقبل، ستُحدَّد التعرفات وأسعار النقل بما يأخذ في الحسبان ليس نفقات التشغيل وحسب، بل أيضاً تكاليف خدمة رأس المال لجهات القطاع. ومع تطور القطاع تدريجياً، ستُضاف عناصر جديدة إلى متطلب الإيراد، كآليات التحفيز التي تُكافئ الشركات على رفع جودة الخدمة قياساً بالمستهدفات.",
    "Currently, only a limited number of water sector entities in the Kingdom have a revenue requirement. For these entities, water transfer prices reflect operating expenditure only, while capital expenditure continues to be directly funded by MoF from the annual budget. Other entities are fully funded, operating and capital expenditure, by MoF. Moving forward, tariffs and transfer prices will be set to recognize not just operating expenditures, but also the capital servicing costs of sector entities. Over time, as the sector matures, additional elements will be introduced to the revenue requirement, such as incentive mechanisms to reward companies that increase service quality relative to a target.",
    {}
  ),
  spacerRow(),

  headRow("1-3 هيكل هذا المستند", "1.3 STRUCTURE OF THIS DOCUMENT"),
  row(
    "جاء هذا المستند مُهيكَلاً ليُفصّل الإطار اللازم لتحديد الإيراد المطلوب للشركات المنظَّمة في المملكة:",
    "This document has been structured to detail the framework to determine the revenue required for regulated companies in the Kingdom:",
    {}
  ),
  row(
    "• القسم 2: يستعرض الإطار السياساتي والتنظيمي العام الذي يحكم تطوير وتشغيل منهجية تحديد متطلب الإيراد وتشغيلها.\n• القسم 3: يتناول الإجراءات الواجب اتباعها في تحديد متطلب الإيراد.\n• القسم 4: يناقش نماذج طلب البيانات التي يتعين على الشركات المنظَّمة تقديمها إلى الهيئة، فضلاً عن إجراءات التحقق من البيانات.\n• القسم 5: يصف المنهجية المعتمدة لاحتساب متطلب الإيراد.",
    "• Section 2 outlines the broad policy and regulatory framework governing the development and operation of the revenue requirement determination methodology.\n• Section 3 provides the processes to be followed in determining the revenue requirement.\n• Section 4 discusses the data request templates that regulated companies must submit to SWA, as well as SWA's data validation process.\n• Section 5 describes the methodology for calculating the revenue requirement.",
    {}
  ),
  spacerRow(),

  headRow("1-4 الجمهور المستهدف", "1.4 INTENDED AUDIENCE"),
  row(
    "أُعِدَّ هذا المستند لتزويد الشركات المنظَّمة وسائر أصحاب المصلحة بملخص شامل لمنهجية تحديد متطلب الإيراد المعتمدة لدى هيئة المياه السعودية، أي الطريقة التي ستُستخدم بها المعلومات المقدَّمة من جهات القطاع لتحديد الإيراد المناسب لأنشطتها المرخصة في قطاع المياه. وسيُحدَّث هذا المستند ليعكس أي تعديلات على المنهجية متى نشأت. وتتوقع الهيئة أنه مع استمرار تطور القطاع واكتساب الخبرة في تطبيق المنهجية، قد تستلزم الأمور إجراء تعديلات.",
    "This document has been developed to provide regulated companies and other stakeholders a summary of the SWA's revenue requirement determination methodology, i.e., the manner in which information provided by the sector entities will be used to determine the appropriate revenue for their licensed water sector activities. This document will be updated to reflect any changes to the methodology, if and when these changes occur. SWA expects that, as the sector continues to evolve and experience is gained regarding the application of the methodology, changes may be required.",
    {}
  ),
  spacerRow(),

  // ── SECTION 2 ──────────────────────────────────────────────────────────────
  headRow("2. الإطار القانوني", "2. LEGAL FRAMEWORK"),
  row(
    "يُلخِّص هذا القسم الإطار القانوني الحالي الذي يمنح هيئة المياه السعودية صلاحية تنظيم الإيرادات للأنشطة المرخصة، ويُلزم المرخَّص لهم بدعم عمل الهيئة في هذا الشأن. ويشمل ذلك: الأدوار والمسؤوليات النسبية للهيئة والشركات المنظَّمة، والأهداف والشروط الحاكمة لمتطلب الإيراد، والمستجدات السياساتية والتنظيمية الأشمل التي قد تؤثر في منهجية تحديد متطلب الإيراد.",
    "This section summarizes the current legal framework that provides SWA with the power to regulate revenue for licensed activities and that obliges licensees to support SWA's work in this area. This includes the relative roles and responsibilities of SWA and the regulated companies, the objectives and conditions governing the revenue requirement, and broader policy and regulatory developments that may affect the revenue requirement determination methodology.",
    {}
  ),
  spacerRow(),

  headRow("2-1 الأدوار والمسؤوليات", "2.1 ROLES AND RESPONSIBILITIES"),
  row(
    "يُرسي نظام المياه (الصادر بالمرسوم الملكي رقم م/159، بتاريخ 11/11/1441هـ) ولوائح تنفيذ أنشطة تقديم الخدمات جملةً من الالتزامات والمسؤوليات على هيئة المياه السعودية، ويمنحها الصلاحيات اللازمة لأداء مهامها. وتشمل أبرز الأطراف المعنية: وزارة البيئة والمياه والزراعة (صانعة السياسات لقطاع المياه)؛ وهيئة المياه السعودية (المنظِّم الاقتصادي والتقني والقانوني)؛ ووزارة المالية (صانعة السياسات المسؤولة عن الميزانيات)؛ وحساب موازنة المياه (المسؤول عن العملية الميزانية للقطاع وبرنامج التسويق)؛ والشركة السعودية لتحلية المياه (الذراع التشغيلية الانتقالية للهيئة)؛ وشركة المياه السعودية للشراكة (المشتري الرئيسي للمياه)؛ وشركة نقل ومعالجة المياه (شركة نقل المياه والتخزين الاستراتيجي)؛ والشركة الوطنية للمياه (المسؤولة عن توزيع المياه وجمع ومعالجة مياه الصرف الصحي)؛ ومرافق (مرفق الكهرباء والمياه في المدن الصناعية)؛ والمنظمة السعودية للري (المسؤولة عن أنشطة الري).",
    "The Water Law (issued by Royal Decree No. M/159, dated 11/11/1441H) and the Service Provision Activities Implementing Regulations impose a number of obligations and responsibilities on SWA and provide it with the power to meet its responsibilities. The key stakeholders include: MEWA (policy maker for the water sector); SWA (economic, technical and legal regulator); MoF (policy maker responsible for budgets); WBA (responsible for the water sector budgetary process and commercialization program); SWCC (SWA's transitional operational wing); SWPC (principal buyer of water); WTTCO (water transmission and strategic storage company); NWC (responsible for water distribution, wastewater collection and treatment); Marafiq (electricity and water utility in industrial cities); and SIO (responsible for irrigation activities).",
    {}
  ),
  row(
    "تتولى هيئة المياه السعودية التنظيمَ الاقتصادي والتقني والقانوني لأنشطة إنتاج المياه ونقلها وتخزينها وتوزيعها وجمع مياه الصرف الصحي ومعالجتها وتوزيع المياه المعالجة، وتُنظِّم كذلك نشاط المشتري الرئيسي. ولا تختص الهيئة بتنظيم استخدام مصادر المياه أو تنظيم حفر الآبار.",
    "SWA is responsible for the economic, technical, and legal regulation of water production, water transmission, water storage, water distribution, wastewater collection, wastewater treatment, and TSE distribution, and also regulates the principal buyer activity. SWA is not responsible for regulating the use of water sources or regulating the digging of water wells.",
    {}
  ),
  spacerRow(),

  headRow("2-1-1 استرداد التكاليف", "2.1.1 COST RECOVERY"),
  row(
    "يُكرَّس تفويض الهيئة بتنظيم إيرادات مزودي الخدمة المرخَّصين في نظام المياه ولوائحه التنفيذية. إذ تُوجب المادة 33 من النظام على الهيئة اعتماد التعرفات المتعلقة بنشاط تقديم الخدمة ومراجعتها بصفة منتظمة. وعند الاعتماد، تأخذ الهيئة بالاعتبار ضرورة تمكين مزودي الخدمة المرخَّصين من استرداد التكلفة الكاملة الكفؤة للخدمة وتحقيق عائد معقول على رأس المال المستثمر. وتُوضح اللوائح التنفيذية أن الهيئة تُحدِّد تعرفة توزيع المياه وجمع مياه الصرف الصحي المطبَّقة على المستفيدين، وتراجعها بصفة دورية وبما لا يتجاوز كل خمس سنوات (المادتان 124 و125). كما تنص اللوائح التنفيذية على أن تخضع تسعيرة الخدمات المتبادلة بين الجهات المرخَّصة للتفاوض التجاري، مع صلاحية الهيئة في فرض ضوابط التسعير على هذه التعرفات أيضاً (المادة 126).",
    "SWA's mandate to regulate the revenue of licensed service providers is established across the Water Law and Implementing Regulations. Article 33 of the Water Law requires SWA to approve tariffs related to the activity of service delivery and regularly review these tariffs. In approving these tariffs, SWA will consider the need to enable licensed service providers to recover the full efficient cost of service and to earn a reasonable return on invested capital. The Implementing Regulations explain that SWA determines the tariff for the distribution of water and collection of wastewater that is applied to customers, and reviews these tariffs periodically, and at least every five years (Articles 124 and 125). The Implementing Regulations provide that the pricing of services between licensed entities are subject to commercial negotiations, however SWA may impose pricing controls on these tariffs as well (Article 126).",
    {}
  ),
  spacerRow(),

  headRow("2-1-2 تقديم البيانات", "2.1.2 DATA PROVISION"),
  row(
    "تُخوِّل المادة 6 من نظام المياه هيئةَ المياه السعودية حق طلب البيانات من الجهات المرخَّصة للاضطلاع بمهامها. ويتعين على الشركات تزويد الهيئة بالمعلومات في الصيغة المطلوبة. وتُجرِّم المادة 67 من النظام على الجهات المرخَّصة: تزويد الهيئة بمعلومات مضللة أو غير صحيحة؛ والإخفاق في الإفصاح عن المعلومات التي طلبتها الهيئة بالصيغة المقررة؛ وإخفاء المعلومات. كما يتعين على المرخَّص لهم تقديم التقارير والمعلومات إلى الهيئة بصفة دورية وفق الجدول الزمني المعتمد، وإخطار الهيئة بأي تعديلات (المادة 132).",
    "Article 6 of the Water Law gives SWA the right to request data from licensed entities to perform its mandate. Companies need to provide information to SWA in the requested format. Article 67 of the Water Law makes it illegal for licensed entities to: provide SWA with misleading or incorrect information; fail to disclose information that has been requested by SWA in the required format; and conceal information. Licensees must also periodically submit reports and information to SWA within the approved timetable and notify SWA of any amendments (Article 132).",
    {}
  ),
  spacerRow(),

  headRow("2-1-3 جودة الخدمة", "2.1.3 QUALITY OF SERVICE"),
  row(
    "وفقاً للمادة 76 من نظام المياه، تضع الهيئة معايير الأداء الواجب على مزودي الخدمة المرخَّصين استيفاؤها. وتضطلع الهيئة بمهمة مراقبة جودة المياه لدى مزودي الخدمة المرخَّصين وضمان الامتثال للمعايير التي تعتمدها وزارة البيئة والمياه والزراعة (المادة 60). ويتعين على الهيئة عند تحديد التعرفات مراعاة الحوافز الرامية إلى تعزيز جودة الخدمة.",
    "According to Article 76 of the Water Law, SWA will set performance standards that must be fulfilled by licensed service providers. SWA has a duty to monitor the water quality of licensed service providers and to ensure compliance with the standards approved by MEWA (Article 60). In setting tariffs, SWA must consider incentives to enhance service quality.",
    {}
  ),
  spacerRow(),

  headRow("2-1-4 التراخيص", "2.1.4 LICENSES"),
  row(
    "يتعين على مزودي خدمات المياه الحصول على تراخيص من هيئة المياه السعودية لممارسة الأنشطة في قطاع المياه، وتشمل: ترخيص المشتري الرئيسي؛ وترخيص إنتاج المياه المحلَّاة؛ وترخيص إنتاج المياه المنقاة؛ وترخيص نقل المياه المحلَّاة والمنقاة؛ وترخيص التخزين الاستراتيجي للمياه؛ وترخيص توزيع وبيع المياه المحلَّاة والمنقاة؛ وترخيص معالجة مياه الصرف الصحي؛ وترخيص جمع مياه الصرف الصحي ونقلها؛ وترخيص نقل وتوزيع وبيع مياه الصرف الصحي المعالجة.",
    "Water service providers must obtain licenses from SWA to perform activities in the water sector, including: Principal buyer license; Desalinated water production license; Purified water production license; Desalinated and purified water transmission license; Strategic water storage license; Desalinated and purified water distribution and sale license; Wastewater treatment license; Wastewater collection and transmission license; and Treated wastewater transmission, distribution and sale license.",
    {}
  ),
  spacerRow(),

  headRow("2-2 متطلب الإيراد", "2.2 REVENUE REQUIREMENT"),
  row(
    "تُرسي أهداف نظام المياه أهدافَ الهيئة لمنهجية تحديد متطلب الإيراد. إذ تستهدف المادة 2 ضمان إمكانية الوصول إلى إمدادات مياه آمنة ونظيفة وموثوقة بأسعار تنافسية ومعقولة تكفل العدالة بين المستفيدين، وتستوجب تعزيز مشاركة القطاع الخاص. وتنص المادة 33 على ضرورة أن تأخذ الهيئة بالاعتبار: مبدأ ترشيد المياه والحفاظ عليها واستدامتها؛ والحوافز لتعزيز الكفاءة الفنية والكفاءة الاقتصادية وجودة الخدمة؛ ومتطلبات سياسات التنمية الوطنية واستراتيجياتها؛ وتمكين مزود الخدمة المرخَّص من العمل بكفاءة لاسترداد كامل التكاليف وتحقيق عائد معقول على رأس المال المستثمر؛ والوضوح وسهولة التطبيق والإدارة؛ والأحوال الاقتصادية لمحدودي الدخل؛ وطبيعة النشاط الاقتصادي المستخدَم للمياه.",
    "The objectives of the Water Law establish SWA's objectives for the revenue requirement determination methodology. Article 2 aims to ensure access to safe, clean, reliable water supply at competitive and reasonable prices ensuring fairness among consumers, and requires the enhancement of private sector participation. Article 33 states that SWA needs to consider: Principle of water conservation, preservation and sustainability; Incentives to enhance technical efficiency, economic efficiency, and service quality; Requirements of national development policies and strategies; Enable the licensed service provider to operate efficiently to recover the full costs and realize reasonable return on the invested capital; Clarity and ease of implementation and management; Economic conditions of the low-income people; and Nature of economic activity used for water.",
    {}
  ),
  spacerRow(),

  headRow("2-3 المستجدات السياساتية والتنظيمية الأشمل", "2.3 BROADER POLICY AND REGULATORY DEVELOPMENTS"),
  row(
    "ثمة عناصر عديدة في الإطار السياساتي والتنظيمي الأشمل تؤثر في متطلب الإيراد، تتراوح بين الأهداف الاقتصادية الشاملة والمبادرات الخاصة بشركات المياه. وتنبثق الأهداف الاقتصادية الشاملة من السياسات والخطط الحكومية، في مقدمتها رؤية 2030 وبرامج التحول الوطني. وتحدد الاستراتيجية الوطنية للمياه 2030 الرؤية الشاملة بأنها: «قطاع مائي مستدام يصون الموارد الطبيعية والبيئة في المملكة ويوفر إمدادات فعَّالة التكلفة وخدمات عالية الجودة». ومن أبرز الأهداف ذات الصلة بمنهجية تحديد متطلب الإيراد لدى الهيئة: تقديم الخدمات بفعالية تكلفة؛ ومنح التراخيص لمزودي الخدمة ومراجعة التعرفات؛ والإصلاح المؤسسي لقطاع التحلية وإعداد قطاع توزيع المياه للخصخصة؛ وتعزيز مشاركة القطاع الخاص لتقليص الإنفاق الحكومي الرأسمالي وتحسين أداء القطاع.",
    "There are a number of elements of the broader policy and regulatory framework that have an impact on the revenue requirement. These range from economy-wide objectives to specific initiatives for water companies. Economy-wide objectives derive from government policies and plans including Vision 2030 and the National Transformation Programs. The National Water Strategy 2030 sets out the overall vision: \"A sustainable water sector, safeguarding the natural resources and the environment of the Kingdom and providing cost-effective supply and high-quality services.\" Objectives particularly important to SWA's revenue requirement determination methodology include: delivering cost-effective services; granting licenses to service providers and reviewing tariffs; the desalination sector institutional reform and preparation of the water distribution sector for privatization; and enhancing private sector participation to reduce government capital outlay and enhance sector performance.",
    {}
  ),
  spacerRow(),

  // ── SECTION 3 ──────────────────────────────────────────────────────────────
  headRow("3. إجراءات احتساب متطلب الإيراد", "3. PROCESS FOR CALCULATING THE REVENUE REQUIREMENT"),

  headRow("3-1 المقدمة", "3.1 INTRODUCTION"),
  row(
    "يهدف هذا القسم إلى تحديد إجراءات تحديد متطلب إيراد جهات قطاع المياه. وبالإضافة إلى وضع جدول زمني تقريبي لتحديد متطلب الإيراد، يُعرِّف هذا القسم كذلك مسؤوليات مختلف الأطراف في هذه العملية.",
    "The purpose of this section is to set out the process for setting the revenue requirement of water sector entities. As well as establishing an approximate timeline for the determination of the revenue requirement, this section also defines the responsibilities of the various stakeholders in the process.",
    {}
  ),
  spacerRow(),

  headRow("3-2 المبادئ الجوهرية", "3.2 UNDERLYING PRINCIPLES"),
  row(
    "ينبغي أن تكون إجراءات تحديد متطلب الإيراد مُهيكَلة بصورة مثلى لتلبية عدد من المعايير الرئيسية:",
    "The process for setting the revenue requirement should ideally be structured to meet a number of key criteria:",
    {}
  ),
  row(
    "• صدور القرار النهائي بحلول نهاية الربع الثالث من العام السابق للعام الذي يُطبَّق فيه متطلب الإيراد.\n• أن تتضمن الإجراءات مرحلة تشاور تُتيح للشركات المنظَّمة التعليق على القرار المبدئي للهيئة.\n• أن تُكمِّل الإجراءاتُ الآلياتِ التنظيمية الأخرى الحاكمة للشركات المنظَّمة، بما فيها حساب موازنة المياه.\n• أن تُيسِّر الإجراءات التفاعل البنَّاء بين الأطراف المعنية.\n• ألا تُلقي الإجراءات عبئاً مفرطاً على الشركات المنظَّمة أو الهيئة.\n• أن تكون الإجراءات موحَّدة لجميع الشركات المنظَّمة العاملة في قطاع المياه.\n• تخصيص وقت كافٍ لمراجعة تطبيق الإجراءات واستخلاص الدروس المستفادة.",
    "• The final determination should be produced by the end of the third quarter of the year before the year in which the revenue requirement is to be applied.\n• The process should include a period of consultation, allowing regulated companies to comment on SWA's initial determination.\n• The process should complement other regulatory mechanisms governing regulated companies, including WBA.\n• The process should facilitate constructive engagement between the parties involved.\n• The process should not impose an excessive burden upon neither the regulated companies nor SWA.\n• The process should be the same for all regulated companies operating in the water sector.\n• Time should be allowed to review the implementation of the process and derive lessons learned.",
    {}
  ),
  spacerRow(),

  headRow("3-3 إجراءات التحديد", "3.3 DETERMINATION PROCESS"),
  row(
    "تتألف العملية الشاملة لتحديد متطلب إيراد شركات المياه من سبع خطوات:",
    "The overall process for determining water companies' revenue requirement is made up of seven steps:",
    {}
  ),
  row(
    "الخطوة 1 — تقديم البيانات: تُكمِل شركات المياه النماذج المقدَّمة من الهيئة وترفع تقديماتها إليها. ويشترط أن تكون البيانات المقدَّمة موثوقة ودقيقة.\nالخطوة 2 — التحقق من البيانات: تُراجع الهيئة تقديمات الشركات ومقارنتها بافتراضاتها الداخلية وتحليلاتها، مع طلب التوضيحات عند الحاجة.\nالخطوة 3 — التحديد المبدئي: تُعِدّ الهيئة تحديدها المبدئي لمتطلبات إيراد الشركات استناداً إلى أحدث البيانات المستلَمة بحلول الموعد المتفق عليه. وفيما يخص أي مجالات تُعدّ فيها المعلومات ناقصة أو غير صالحة، يجوز للهيئة سد الفجوات باستخدام افتراضات معقولة.\nالخطوة 4 — التشاور مع أصحاب المصلحة: تتاح للشركات وسائر أصحاب المصلحة المعنيين فرصة التعليق على التحديد المبدئي للهيئة وتقديم أدلة داعمة إضافية.\nالخطوة 5 — التحديد النهائي: تُعِدّ الهيئة وتُصدر تحديدها النهائي استناداً إلى نتائج التشاور مع أصحاب المصلحة، ثم تُعدِّل التعرفات المنطبقة لإنفاذ هذا القرار.\nالخطوة 6 — الموافقات: يخضع القرار النهائي والتعرفات اللاحقة عند الاقتضاء لإجراءات موافقة للتطبيق في العام التالي، بما يشمل موافقة اللجنة الوزارية على أسعار نقل المياه.\nالخطوة 7 — مراجعة الإجراءات: تُجري الهيئة مراجعة لطريقة تطبيق الإجراءات استناداً إلى ملاحظات أصحاب المصلحة، وتدرس إجراء تعديلات للدورة التنظيمية القادمة.",
    "Step 1 — Data submissions: The water companies complete the data templates provided by SWA and deliver their submissions to SWA. The data submitted is required to be credible and robust.\nStep 2 — Data validation: SWA carries out a review of the companies' submissions, comparing them against its internal assumptions and analysis, asking for clarifications as required.\nStep 3 — Initial determination: SWA produces its initial determination of companies' revenue requirements, using the latest data received by the agreed deadline. For any areas where information is deemed missing or invalid, SWA may complete the gaps with reasonable assumptions.\nStep 4 — Stakeholder consultation: The companies and other relevant stakeholders are consulted and can comment on SWA's initial determination and provide further supporting evidence.\nStep 5 — Final determination: Based on the results of the stakeholder consultation, SWA prepares and issues its final determination. Subsequently, SWA modifies applicable tariffs to give its final determination effect.\nStep 6 — Approvals: Final determinations, and subsequent tariffs if applicable, will follow an approval process for implementation in the following year, including Ministerial Committee approval of water transfer prices.\nStep 7 — Process review: SWA conducts a review of the way in which the process was implemented based on stakeholders' feedback and considers whether to make changes for the next price control period.",
    {}
  ),
  spacerRow(),

  headRow("3-3-1 الجدول الزمني", "3.3.1 TIMELINE"),
  row(
    "الجدول الزمني لعملية تحديد متطلب الإيراد استرشادي ومرن بما يكفي لضمان التوافق مع حساب موازنة المياه ومتطلبات القطاع الأشمل. وقبل انطلاق كل دورة تحديد جديدة، تُنشر الهيئة جدولاً زمنياً خاصاً بعملية تلك السنة، مراعيةً العطلات الرسمية في المملكة.",
    "The timetable for the revenue requirement determination process is indicative and flexible enough to ensure alignment with WBA and wider sector requirements. In advance of beginning each new determination process, SWA will publish a timeline specific to that year's process, considering public holidays in the Kingdom.",
    {}
  ),
  spacerRow(),

  // ── SECTION 4 ──────────────────────────────────────────────────────────────
  headRow("4. نماذج إعداد التقارير والتحقق من البيانات", "4. REPORTING TEMPLATES AND DATA VALIDATION"),

  headRow("4-1 نماذج البيانات", "4.1 DATA TEMPLATES"),
  row(
    "أعدَّت الهيئة نماذج بيانات مُخصَّصة لكل جهة منظَّمة في قطاع المياه بصيغة Microsoft Excel، تطلب فيها بيانات عن التكاليف وقيمة الأصول الثابتة والإيرادات والمعلومات التشغيلية. وستُستخدم البيانات التي تقدمها الشركات في هذه النماذج لتحديد متطلبات إيراد الشركات. ومن خلال هذه الطلبات، يُشترط على الشركات تقديم بيانات من بينها: نفقات التشغيل (أوبكس) مصنَّفةً حسب فئات التكلفة، مع تفاصيل الطاقة والعمالة والمصاريف العمومية والإدارية؛ وبيانات تتعلق بالقيم الدفترية الإجمالية والصافية للأصول الثابتة؛ والقيم السنوية لتكاليف الشفافية كشراء المياه أو خدمات معالجة مياه الصرف الصحي؛ ومقدار الإيراد المتولِّد عن الخدمات المرخصة المقدَّمة؛ والكميات التشغيلية المرتبطة بالمصاريف المُبلَّغ عنها.",
    "SWA has prepared data templates, customized for each regulated water sector entity in Microsoft Excel format, which request data from companies on costs, the value of fixed assets, revenue, and operational information. The data submitted by companies in these data templates will be used by SWA to set the companies' revenue requirements. Through these data requests, companies will be required to provide data such as: Operating expenditures (OPEX) by cost category, including details of energy, employees, and general and administrative expenses; Data pertaining to the gross and net book values of fixed assets; The annual values of passthrough costs such as purchase of water or wastewater treatment services; Revenue amount generated by the licensed services provided; and Operational quantities associated with reported expenses.",
    {}
  ),
  row(
    "فيما يتعلق بالأصول الثابتة، توجِّه الهيئة الشركاتِ إلى تقديم القيم الدفترية الإجمالية والصافية، فضلاً عن القيم الدفترية للأصول الثابتة الممولة بالمنح ومساهمات المستفيدين. ولا يحق للشركات استرداد تكاليف الأصول الثابتة الممولة بالمنح ومساهمات المستفيدين من خلال متطلب الإيراد. وتطلب نماذج البيانات من الشركات تقديم بيانات تاريخية وتوقعية تغطي الفترة حتى نهاية دورة ضبط الأسعار ذات الصلة.",
    "With respect to fixed assets, SWA directs that companies submit total book values, gross and net, as well as the book values of fixed assets funded by grants and customer contributions. Companies should not recover the costs of new fixed assets funded by grants and customer contributions through the revenue requirement. The data templates request companies to provide both historical and forecast data covering the period until the end of the relevant price control period.",
    {}
  ),
  spacerRow(),

  headRow("4-2 التحقق من البيانات", "4.2 DATA VALIDATION"),
  row(
    "نظراً لاستخدام البيانات في احتساب متطلب الإيراد، يجب أن تكون دقيقة. وبمجرد استلام الهيئة نماذج البيانات المكتملة من الشركات، تُجري عملية تحقق شاملة تتضمن: التحقق من اكتمال البيانات المقدَّمة؛ والتأكد من الاتساق الداخلي للبيانات؛ والكشف عن القيم الشاذة؛ والمقارنة المرجعية مع البيانات المتاحة للهيئة من مصادر أخرى؛ والتحقق من دقة البيانات وموثوقيتها عبر مراجعة ميدانية؛ وتقييم معقولية البيانات على المستوى الكلي، ولا سيما التوقعات.",
    "As data is used to calculate the revenue requirement, the data must be accurate. Once SWA receives the completed data templates from companies, it will go through a process of data validation. This process will involve: Checking that the data provided is complete; Ensuring that the data provided is internally consistent; Identifying outliers; Cross-checking data provided with data available to SWA from other sources; Checking that the data provided is accurate and reliable through a data audit; and Assessing at a high level the reasonableness of the data and especially of the forecasts.",
    {}
  ),
  row(
    "في أعقاب هذه العملية، ستطلب الهيئة من الشركات توضيح تقديماتها البيانية، أو إعادة تقديمها عند الاقتضاء. وفي حال عجز الشركات عن تقديم البيانات المطلوبة بحلول المواعيد المتفق عليها، يجوز للهيئة سد الفجوات باستخدام افتراضات معقولة. وإذا توفرت البيانات في مرحلة لاحقة، يجوز للهيئة السماح بتعديل بدلات الإيراد المستقبلية من خلال آلية تصحيح الإيراد.",
    "Following this process, SWA will ask the companies to clarify their data submissions, or if necessary, to re-submit the data. Where companies are unable to provide the required data by the agreed deadlines, SWA may complete the gaps with reasonable assumptions. If data becomes available at a later stage, SWA may allow an adjustment to future revenue allowances through the Revenue Correction mechanism.",
    {}
  ),
  spacerRow(),

  // ── SECTION 5 ──────────────────────────────────────────────────────────────
  headRow("5. منهجية تحديد متطلب الإيراد", "5. REVENUE REQUIREMENT DETERMINATION METHODOLOGY"),

  headRow("5-1 المبادئ الجوهرية", "5.1 UNDERLYING PRINCIPLES"),
  row(
    "تنسجم هذه المنهجية التفصيلية مع عدد من المبادئ الرفيعة المستوى: تُسهم في تحقيق الهدف الرئيسي للهيئة المتمثل في حماية مصالح المستفيدين عبر تنظيم إيرادات جميع عناصر قطاع المياه ذات الطابع الاحتكاري؛ وتُحفِّز الكفاءة وتحسينات أداء الشركات المنظَّمة؛ وتسعى إلى توفير تدفق إيرادات مستقر ومتوقع للشركات المنظَّمة؛ وتُطبَّق بصورة موحَّدة على جميع الشركات المنظَّمة مع توظيف البيانات الخاصة بكل شركة لتحديد متطلب إيرادها الفردي؛ ويُتاح للشركات المنظَّمة تحقيق عائد على الاستثمارات المُنجزة، إلا في الحالات التي تُموَّل فيها الاستثمارات من المنح و/أو مساهمات المستفيدين؛ ولا يُسمح لأي شركة منظَّمة بتحقيق عائد على تكاليف الشفافية، إلا في الحالات التي ينطبق فيها بدل رأس المال العامل.",
    "This detailed methodology is consistent with a number of high-level principles: It helps to fulfil SWA's key objective of protecting customers' interests by regulating the revenue of all monopolistic elements of the water sector; It encourages efficiency and improvements in regulated companies' performance; It aims to provide a stable and predictable future revenue stream for regulated companies; It is applied consistently across all regulated companies, but uses company-specific data to determine each company's specific revenue requirement; Regulated companies will be allowed to earn a return on investments made, except for instances in which investments are funded through grants and/or customer contributions; No regulated company will be allowed to earn a return on passthrough costs, except for instances in which a working capital allowance is applicable.",
    {}
  ),
  spacerRow(),

  headRow("5-2 الافتراضات", "5.2 ASSUMPTIONS"),
  row(
    "• يُفترض أن البنية التحتية وخطط رأس المال للشركات قد خضعت للمراجعة والاعتماد عبر إجراء منفصل.\n• اعتُمد نهج التكلفة التاريخية لتقييم الأصول.\n• يُتيح اعتماد دورة ضبط أسعار متعددة السنوات للشركات الوقت الكافي للتعامل مع أهداف الكفاءة وحافزاً لتحقيق تحسينات.\n• تُفصَل الأنشطة غير المنظَّمة عن الأنشطة المنظَّمة، ولا تُحدَّد متطلبات الإيراد لاسترداد التكاليف المرتبطة بالأنشطة غير المنظَّمة.",
    "• Companies' infrastructure and capital plans are assumed to have been reviewed and approved through a separate process.\n• The historical cost-based approach has been adopted for the valuation of assets.\n• The adoption of a multi-year price control period provides the companies with time to engage with efficiency targets and an incentive to pursue improvements.\n• Any unregulated businesses are separated from the regulated business and revenue requirements are not set to recover the costs associated with non-regulated activities.",
    {}
  ),
  spacerRow(),

  headRow("5-3 المعادلة الرئيسية لمتطلب الإيراد", "5.3 REVENUE REQUIREMENT MASTER FORMULA"),
  row(
    "صيغة احتساب متطلب الإيراد للسنة (t):",
    "The formula for calculating the revenue requirement for a particular year t is:",
    {}
  ),
  formulaRow(
    "RR(t) = AO(t) + CS(t) + Dis(t) + PTC(t) + RC(t)",
    "RR(t) = AO(t) + CS(t) + Dis(t) + PTC(t) + RC(t)"
  ),
  row(
    "حيث: RR(t) = متطلب الإيراد في السنة (t)؛ AO(t) = نفقات التشغيل المسموح بها في السنة (t)؛ CS(t) = تكاليف خدمة رأس المال في السنة (t)؛ Dis(t) = التكلفة المسموح بها للتخلص من الأصول في السنة (t)؛ PTC(t) = تكاليف الشفافية في السنة (t)؛ RC(t) = تصحيح الإيراد في السنة (t).",
    "Where: RR(t) = Revenue requirement in year t; AO(t) = Allowed OPEX in year t; CS(t) = Capital servicing costs in year t; Dis(t) = Allowed cost of disposal in year t; PTC(t) = Passthrough costs in year t; RC(t) = Revenue correction in year t.",
    {}
  ),
  spacerRow(),

  headRow("5-4 نفقات التشغيل المسموح بها", "5.4 ALLOWED OPEX"),
  row(
    "تُعرَّف نفقات التشغيل المسموح بها (AO) بأنها نفقات التشغيل والصيانة المرتبطة بتقديم الخدمات المطلوبة للمستفيدين وفق المعايير والجودة المقررة بأكثر الطرق فعَّالةً من حيث التكلفة. وتُحدَّد نفقات التشغيل المسموح بها في السنة (t) وفق المعادلة:",
    "Allowed OPEX (AO) is defined as the operating and maintenance expenditure associated with providing the required services to customers at the required standards and quality in the most cost-efficient manner. Allowed OPEX in year t is determined as:",
    {}
  ),
  formulaRow(
    "AO(t) = Adjusted OPEX(t) + Sharing factor(t) × [Forecasted OPEX(t) - Adjusted OPEX(t)] + Extraordinary OPEX(t)",
    "AO(t) = Adjusted OPEX(t) + Sharing factor(t) × [Forecasted OPEX(t) - Adjusted OPEX(t)] + Extraordinary OPEX(t)"
  ),
  formulaRow(
    "Adjusted OPEX(t) = Actual OPEX(R) × Output factor(t) × Inflation factor(t) × Efficiency factor(t)",
    "Adjusted OPEX(t) = Actual OPEX(R) × Output factor(t) × Inflation factor(t) × Efficiency factor(t)"
  ),
  row(
    "حيث Actual OPEX(R) هو نفقات التشغيل الفعلية لسنة المرجع في دورة ضبط الأسعار. وتُحدَّد نفقات التشغيل المعدَّلة دالةً لنفقات التشغيل الفعلية للشركة في سنة المرجع وعدد من المعاملات (معامل المخرجات، ومعامل التضخم، ومعامل الكفاءة) الهادفة إلى استيعاب الفروق بين ظروف سنة المرجع (R) والسنة (t).",
    "Actual OPEX(R) is the actual OPEX for the reference year of the price control period. Adjusted OPEX is set as a function of the company's actual OPEX in the reference year and a number of factors (the output factor, inflation factor and efficiency factor) that are intended to capture differences between conditions in the reference year R and year t.",
    {}
  ),
  row(
    "ثم تُحدَّد نفقات التشغيل المسموح بها بوصفها متوسطاً موزوناً بين نفقات التشغيل التوقعية للشركة ونفقات التشغيل المعدَّلة المحددة من قِبل الهيئة، بحيث تُعرَّف الأوزان بمعامل المشاركة الذي تُحدده الهيئة بين 0 و1. ومن الناحية العملية، يُستعاض عن نفقات التشغيل التوقعية بنفقات التشغيل الفعلية عبر مكوِّن تصحيح الإيراد.",
    "Allowed OPEX is then set as a weighted average of the company's forecast OPEX and the adjusted OPEX defined by SWA, with the weights defined by a sharing factor set by SWA between 0 and 1. In practice, forecast OPEX will be replaced with actual outturn OPEX via the Revenue Correction component.",
    {}
  ),
  row(
    "بوجه عام، ستُعرِّف الهيئة سنة مرجعية استناداً إلى متوسط نفقات التشغيل المرصودة عبر عدد من السنوات التاريخية. والغرض من ذلك تفادي تشويه بدلات نفقات التشغيل بالاعتماد على بيانات سنة بعينها قد تتأثر بتقلبات حادة من سنة لأخرى، وتجنب تحفيز الشركات المنظَّمة على تضخيم نفقاتها في سنة محددة.",
    "In general, SWA will define a reference year based on average OPEX observed across a number of historical years. This is to avoid distorting OPEX allowances by relying on data for any particular year which could be distorted by large year-on-year fluctuations, and to avoid providing regulated companies with an incentive to inflate their OPEX in a particular year.",
    {}
  ),
  spacerRow(),

  headRow("5-4-1 معامل المخرجات", "5.4.1 OUTPUT FACTOR"),
  row(
    "يجب أن يُراعي تحديد متطلب الإيراد التغيرات في مخرجات الشركات المنظَّمة وحجم نشاطها. وستُعرِّف الهيئة متغيرات المخرجات لكل شركة منظَّمة. ويُحسَب مؤشر المخرجات وفق:",
    "Changes in regulated companies' output and scale of activity must be taken into account in determining their revenue requirement. SWA will define output variables for each regulated company. The output index is calculated as:",
    {}
  ),
  formulaRow(
    "Output index(t) = Output index(t-1) × [1 + a×(A(t)/A(t-1)-1) + b×(B(t)/B(t-1)-1) + ...]",
    "Output index(t) = Output index(t-1) × [1 + a×(A(t)/A(t-1)-1) + b×(B(t)/B(t-1)-1) + ...]"
  ),
  row(
    "حيث: المتغيران A وB يمثلان خصائص المنظومة المحرِّكة للتغير السنوي في نفقات التشغيل؛ والمعاملان a وb يمثلان الأهمية النسبية لكل خاصية من خصائص المنظومة؛ ويجب أن يكون a + b + ... ≤ 1.",
    "Where: Variables A and B represent system characteristics that drive annual OPEX variation; Parameters a and b represent the relative importance of each system characteristic; and a + b + ... ≤ 1.",
    {}
  ),
  formulaRow(
    "Output factor(t) = Output index(t) / Output index(R)",
    "Output factor(t) = Output index(t) / Output index(R)"
  ),
  spacerRow(),

  headRow("5-4-2 معامل التضخم", "5.4.2 INFLATION FACTOR"),
  row(
    "يُدرج المعدل المتوقع للتضخم في احتساب متطلب الإيراد. وتُستخدم توقعات صندوق النقد الدولي الواردة في تقرير آفاق الاقتصاد العالمي لمعدل التضخم في المملكة مقيساً بأسعار المستهلكين في الاحتساب المسبق. ومؤشر التضخم هو:",
    "The expected rate of inflation is included in the calculation of the revenue requirement. The IMF's World Economic Outlook forecasts for the Kingdom's rate of inflation as measured by consumer prices is used in the ex-ante calculation. The inflation index is:",
    {}
  ),
  formulaRow(
    "Inflation index(t) = Inflation index(t-1) × (1 + CPI rate(t))",
    "Inflation index(t) = Inflation index(t-1) × (1 + CPI rate(t))"
  ),
  formulaRow(
    "Inflation factor(t) = Inflation index(t) / Inflation index(R)",
    "Inflation factor(t) = Inflation index(t) / Inflation index(R)"
  ),
  row(
    "عند إجراء الاحتساب البعدي لمتطلب الإيراد، على الهيئة مراعاة القيم التاريخية للرقم القياسي لأسعار المستهلكين في المملكة كما تنشرها البنك المركزي السعودي (ساما).",
    "When performing the ex-post revenue requirement determination, SWA must consider historic values of CPI for the Kingdom, as published by the Saudi Central Bank (SAMA).",
    {}
  ),
  spacerRow(),

  headRow("5-4-3 معامل الكفاءة", "5.4.3 EFFICIENCY FACTOR"),
  row(
    "يُدرج معامل الكفاءة لحماية المستفيدين من التكاليف غير الكفؤة والمفرطة، وإتاحة الفرصة للشركة لتجاوز هذه الأهداف. وستُحدَّد تحسينات الكفاءة السنوية المستهدفة المتوقعة استناداً إلى أهداف الأداء القائمة في القطاع. ويجوز للهيئة تطبيق قيمة ثابتة تتراوح بين 1% و3% سنوياً. ومؤشر الكفاءة هو:",
    "An efficiency factor is included to protect customers from inefficient and excessive costs and to provide the company with an opportunity to over-achieve against those targets. Targeted annual expected efficiency improvement will be defined by existing performance targets in the sector. SWA may apply a constant value between 1% and 3% per annum. The efficiency index is:",
    {}
  ),
  formulaRow(
    "Efficiency index(t) = Efficiency index(t-1) × (1 - Target efficiency improvement(t))",
    "Efficiency index(t) = Efficiency index(t-1) × (1 - Target efficiency improvement(t))"
  ),
  formulaRow(
    "Efficiency factor(t) = Efficiency index(t) / Efficiency index(R)",
    "Efficiency factor(t) = Efficiency index(t) / Efficiency index(R)"
  ),
  spacerRow(),

  headRow("5-4-4 الحوافز لتحقيق الكفاءة", "5.4.4 INCENTIVES TO EFFICIENCIES"),
  row(
    "توفر نفقات التشغيل المسموح بها آليةً لتحفيز الشركات على تعزيز أرباحها المحتملة من خلال تحقيق مكاسب كفاءة تفوق ما تفرضه الهيئة. وعند تجاوز الشركات لأهداف الأداء (دون المساس بمستوى الخدمة وجودتها)، يُتاح لها توليد أرباح لن تستردها الهيئة. وقد تُدخل الهيئة بمرور الوقت مكوِّناً تحفيزياً مخصصاً في متطلب الإيراد لمكافأة الشركات التي ترفع جودة خدمتها قياساً بالمستهدف.",
    "Allowed OPEX provides a mechanism to incentivize companies to potentially increase their profits by achieving higher efficiency gains than enforced by SWA. By over-achieving against performance targets (without compromising level and quality of service), companies will be able to generate profit that will not be taken off by SWA. Over time, SWA may introduce a dedicated incentive component to the revenue requirement to reward companies that increase service quality relative to a target.",
    {}
  ),
  spacerRow(),

  headRow("5-5 تكاليف خدمة رأس المال", "5.5 CAPITAL SERVICING COSTS"),
  row(
    "صيغة احتساب تكاليف خدمة رأس المال المسموح بها هي:",
    "The formula for calculating the allowed capital servicing costs is:",
    {}
  ),
  formulaRow(
    "CS(t) = Dep(t) + WACC × [RAB(t) + WC(t)]",
    "CS(t) = Dep(t) + WACC × [RAB(t) + WC(t)]"
  ),
  row(
    "حيث: CS(t) = تكاليف خدمة رأس المال في السنة (t)؛ Dep(t) = الإهلاك في السنة (t)؛ WACC = المتوسط المرجح لتكلفة رأس المال؛ RAB(t) = قاعدة الأصول التنظيمية في السنة (t)؛ WC(t) = رأس المال العامل في السنة (t).",
    "Where: CS(t) = Capital servicing costs in year t; Dep(t) = Depreciation in year t; WACC = Weighted average cost of capital; RAB(t) = Regulatory asset base in year t; WC(t) = Working capital in year t.",
    {}
  ),
  spacerRow(),

  headRow("5-5-1 قاعدة الأصول التنظيمية", "5.5.1 REGULATORY ASSET BASE"),
  row(
    "قاعدة الأصول التنظيمية (RAB) مفهوم تنظيمي مُصمَّم لتتبع قيمة التكاليف الرأسمالية المتكبَّدة تاريخياً التي لم تتسنَّ للشركة المنظَّمة بعد فرصة استردادها من خلال الإيراد المنظَّم. وستُعرِّف الهيئة قاعدة الأصول التنظيمية من خلال تحليلها التفصيلي للاستثمارات الرأسمالية المتكبَّدة تاريخياً استناداً إلى سجل أصول الشركة المنظَّمة.",
    "The regulatory asset base (RAB) is a regulatory construct, designed to keep track of the value of historically incurred costs that the regulated company has not yet had the opportunity to recover through regulated revenue. SWA will define the RAB from its detailed analysis of the historically incurred capital investments based on the regulated company's asset register.",
    {}
  ),
  row(
    "تتغير قاعدة الأصول التنظيمية نتيجة خصم الإهلاك منها وزيادتها بتكلفة الأصول التي تُجيزها الهيئة:",
    "The RAB changes as assets' depreciation is removed from it and increases as the cost of assets that SWA allows enters the RAB:",
    {}
  ),
  formulaRow(
    "RAB(eoy,t) = RAB(boy,t) + Allowed additions(t) - Depreciation(t) - NBV of disposal(t)",
    "RAB(eoy,t) = RAB(boy,t) + Allowed additions(t) - Depreciation(t) - NBV of disposal(t)"
  ),
  formulaRow(
    "RAB(t) = [RAB(boy,t) + RAB(eoy,t)] / 2",
    "RAB(t) = [RAB(boy,t) + RAB(eoy,t)] / 2"
  ),
  row(
    "يمكن اعتماد عدة مناهج لتحديد قاعدة الأصول التنظيمية الأولية (iRAB): تعيينها بالصفر؛ أو تعيينها مساويةً للقيمة الدفترية الصافية لأصول الشركة؛ أو تعيينها مساويةً للقيمة الاستبدالية الحديثة المهلَكة؛ أو تعيينها لتحقيق نسب التغطية المالية اللازمة للتصنيف الائتماني الاستثماري. ويستلزم الأمر اتخاذ قرار سياساتي مدروس يوازن بين الإبقاء على انخفاض التعرفات للمستفيدين وتحقيق الجدوى المالية للقطاع.",
    "Several approaches could be used to set the initial RAB (iRAB): set equal to zero; set equal to the net book value of the company's assets; set equal to the depreciated modern equivalent replacement value; or set to achieve financial coverage ratios necessary for an investment grade credit rating. A policy decision must be made, carefully considering the trade-off between keeping tariffs low for customers and making the sector financially viable.",
    {}
  ),
  row(
    "تُحدَّد الإضافات الرأسمالية المسموح بها من خلال الإجراء الوزاري لمراجعة واعتماد خطط البنية التحتية ورأس المال. ولن تدخل الأصول الجديدة الممولة بالمنح أو مساهمات المستفيدين ضمن قاعدة الأصول التنظيمية.",
    "Allowed capital additions are determined through the ministerial process for reviewing and approving infrastructure and capital planning. New assets funded through grants or customer contributions will not enter the RAB.",
    {}
  ),
  row(
    "يجب أن تتضمن التكلفة المسموح بها للأصول المدرجة في قاعدة الأصول التنظيمية بدلاً للتكاليف المتعلقة بالأعمال قيد الإنشاء، وهي: الفائدة خلال فترة الإنشاء (IDC) ونفقات التشغيل المرسملة.",
    "The allowed cost of assets entering the RAB needs to include an allowance for costs relating to construction work in progress (CWIP): Interest During Construction (IDC) and capitalized OPEX.",
    {}
  ),
  spacerRow(),

  headRow("5-5-2 الإهلاك", "5.5.2 DEPRECIATION"),
  row(
    "يُدرج الإهلاك لضمان تمكُّن الشركات من استرداد التكلفة الأولية للأصول على مدى أعمارها الإنتاجية. وستُحدد الهيئة جدول إهلاك قاعدة الأصول التنظيمية الأولية لكل جهة في قطاع المياه في بداية دورة ضبط الأسعار الأولى. وتفترض الهيئة أن الأصول الجديدة تدخل قاعدة الأصول التنظيمية في منتصف العام، وبالتالي يُحسب نصف قيمة إهلاكها السنوي فقط في سنة الإضافة. والمنهج المفضَّل لدى الهيئة هو الإهلاك القسطي المتساوي استناداً إلى العمر الإنتاجي للأصل.",
    "Depreciation is included to ensure that companies are able to recover the initial cost of assets over their useful lives. SWA will set a depreciation profile for the iRAB of each water sector entity at the start of the first price control period. SWA assumes that new assets enter the RAB in the middle of the year, and so will only depreciate half of their annual depreciation value in the year of addition. SWA's preferred approach is straight-line depreciation based on the given asset's useful life.",
    {}
  ),
  spacerRow(),

  headRow("5-5-3 رأس المال العامل", "5.5.3 WORKING CAPITAL"),
  row(
    "يهدف رأس المال العامل (WC) إلى توفير بدل للرأس المال الذي تحتاجه الشركة المنظَّمة لسداد تكاليفها والتزاماتها اليومية (نفقات التشغيل وتكاليف الشفافية بما فيها رسوم الترخيص والزكاة) خلال فترة زمنية محددة. وبدل رأس المال العامل هو:",
    "Working capital (WC) is intended to provide an allowance for the capital required by a regulated company to pay for its day-to-day costs and obligations (OPEX and passthrough costs with license fees and Zakat) over a specified period of time. The working capital allowance is:",
    {}
  ),
  formulaRow(
    "WC(t) = WCP(t) × [AO(t) + PTC(t)]",
    "WC(t) = WCP(t) × [AO(t) + PTC(t)]"
  ),
  row(
    "حيث WCP(t) = فترة رأس المال العامل في السنة (t). ويخضع بدل رأس المال العامل لمراجعة الهيئة بناءً على الاحتياجات الخاصة للجهات المنظَّمة.",
    "Where WCP(t) = Working capital period in year t. The working capital allowance is subject to review by SWA based on the specific needs of the regulated entities.",
    {}
  ),
  spacerRow(),

  headRow("5-5-4 المتوسط المرجح لتكلفة رأس المال", "5.5.4 WEIGHTED AVERAGE COST OF CAPITAL"),
  row(
    "يُمثِّل المتوسط المرجح لتكلفة رأس المال (WACC) العائد المنظَّم المسموح به على أصول الشركة، وينبغي أن يعادل تكلفة الفرصة البديلة للاستثمار في الشركة. وسيُعتمد المتوسط المرجح «بالقيمة الاسمية» (Vanilla WACC):",
    "The Weighted Average Cost of Capital (WACC) is the regulated return allowed on a company's assets and should be equivalent to the opportunity cost of investing in the company. A \"vanilla\" WACC will be used:",
    {}
  ),
  formulaRow(
    "WACC(vanilla) = [D/(D+E)] × CoD + [E/(D+E)] × CoE",
    "WACC(vanilla) = [D/(D+E)] × CoD + [E/(D+E)] × CoE"
  ),
  row(
    "حيث: CoD = تكلفة الدين الاسمية قبل الضريبة؛ CoE = العائد الاسمي على حقوق الملكية؛ D = قيمة الدين؛ E = قيمة حقوق الملكية. ويُحسَب المتوسط المرجح لتكلفة رأس المال باستخدام مستوى محدد من الرافعة المالية لإرساء معيار كفاءة افتراضي لجميع الشركات. ويُستخدم نموذج تسعير الأصول الرأسمالية (CAPM) لتحديد تكلفة حقوق الملكية.",
    "Where: CoD = pre-tax nominal cost of debt; CoE = nominal return on equity; D = value of debt; E = value of equity. The WACC is calculated using a specified level of gearing to establish a notionally efficient standard for all companies. The Capital Asset Pricing Model (CAPM) is used to establish the cost of equity.",
    {}
  ),
  spacerRow(),

  headRow("5-6 التكلفة المسموح بها للتخلص من الأصول", "5.6 ALLOWED COST OF DISPOSAL"),
  row(
    "بناءً على تقييم الهيئة، قد يُسمح للشركة باسترداد إيراد إضافي فيما يخص حالات التخلص المبكر الاستثنائي من الأصول، حيث تُخرج الشركة أصلاً من الخدمة قبل انقضاء عمره الإنتاجي. وفي حالة التخلص الاستثنائي، يجوز أن يشمل متطلب الإيراد:",
    "Based on SWA's assessment, the company may be allowed to recover additional revenue in relation to extraordinary early asset disposals, where the company decommissions an asset before the end of its useful life. In case of an extraordinary disposal event, the revenue requirement may include:",
    {}
  ),
  formulaRow(
    "Dis(t) = NBV of disposal(t) + Cost of disposal(t) - Revenue from disposal(t)",
    "Dis(t) = NBV of disposal(t) + Cost of disposal(t) - Revenue from disposal(t)"
  ),
  row(
    "ما لم تُزوِّد الشركة الهيئة بأدلة داعمة، تُعيِّن الهيئة قيمة صفر لهذه التكلفة قبل إجراء التقييم البعدي. وتكون قيمة التخلص المسموح بها مساويةً للقيمة الدفترية الصافية للأصل المُخرج من الخدمة، مُخصَّصةً بنسبة القيمة الأولية للأصل إلى القيمة المضافة إلى قاعدة الأصول التنظيمية.",
    "Unless provided with evidence from the company, SWA shall set this allowed cost of extraordinary disposal at zero before an ex-post assessment. The allowed disposal value shall be equal to the NBV of the decommissioned asset, pro-rated as appropriate by the ratio between the asset's initial value and the value added to the RAB.",
    {}
  ),
  spacerRow(),

  headRow("5-7 تكاليف الشفافية", "5.7 PASSTHROUGH COSTS"),
  row(
    "تكاليف الشفافية (PTC) هي التكاليف التي لا تملك الشركة أي سيطرة عليها، وقد تشمل رسوم الترخيص والزكاة ونقل متطلب الإيراد من الجهات الأعلى سلسلةً إلى الجهات الأدنى. وتُسمح للشركة باسترداد تكاليفها الفعلية للبنود المصنَّفة تكاليف شفافية. وتحديداً:",
    "Passthrough Costs (PTC) are costs over which the company has no control and may include license fees, Zakat, and the passthrough of the revenue requirement of upstream entities to downstream entities. The company will be allowed to recover its actual costs for items classified as passthrough costs. Specifically:",
    {}
  ),
  row(
    "• بالنسبة للمشتري الرئيسي: متطلب إيراد إنتاج المياه المستقلة ونقلها وتخزينها الاستراتيجي ومعالجة مياه الصرف الصحي وإنتاج المياه العامة ونقلها.\n• بالنسبة لشركة توزيع المياه: متطلب إيراد جميع خدمات المياه ومياه الصرف الصحي المقدَّمة عبر المشتري الرئيسي.",
    "• For the principal buyer: the revenue requirement of independent water production, transmission, strategic water storage, sewage treatment, public water production, and transmission.\n• For the water distribution company: the revenue requirement of all water and wastewater services provided through the principal buyer.",
    {}
  ),
  spacerRow(),

  headRow("5-8 تصحيح الإيراد", "5.8 REVENUE CORRECTION"),
  row(
    "يهدف مكوِّن تصحيح الإيراد (RC) إلى ضمان عدم تضرر الشركة أو المستفيدين جراء الفوارق بين القيم التوقعية والفعلية لبعض المعاملات المستقبلية كالتضخم أو نمو الطلب. وتصحيح الإيراد عبارة عن تعديل على متطلب الإيراد في سنة معينة، لمعالجة الفارق في السنة السابقة بين الإيراد الفعلي المحقَّق والإيراد المسموح به المُعدَّل بالقيم الفعلية للمعاملات غير المؤكدة المحددة مسبقاً.",
    "The objective of the Revenue Correction (RC) process is to ensure that neither the company nor customers are put at a disadvantage due to variations between the forecasted and actual values of certain future parameters, such as inflation or demand growth. The revenue correction component is an adjustment to the revenue requirement in a given year, to account for the difference in a preceding year between actual revenue earned and allowed revenue adjusted for outturn values of pre-defined uncertain parameters.",
    {}
  ),
  row(
    "ستُطبق الهيئة تصحيح الإيراد سنوياً بتأخر سنتين، أي أن الفائض أو العجز في السنة (t) سيُعوَّض عنه من خلال بند RC في متطلب إيراد السنة (t+2).",
    "SWA will apply the revenue correction annually with a two-year lag, i.e., under- or over-recovery in year t will be compensated through the RC term in the year t+2 revenue requirement.",
    {}
  ),
  formulaRow(
    "RC(t) = (1+WACC)^2 × [Adjusted RR(t-2) - Actual revenue(t-2)] + NRW correction(t)",
    "RC(t) = (1+WACC)^2 × [Adjusted RR(t-2) - Actual revenue(t-2)] + NRW correction(t)"
  ),
  formulaRow(
    "NRW correction(t) = min{0, [Target NRW(t-2) - Actual NRW(t-2)] × Actual input volume(t-2) × NRW rate(t-2)}",
    "NRW correction(t) = min{0, [Target NRW(t-2) - Actual NRW(t-2)] × Actual input volume(t-2) × NRW rate(t-2)}"
  ),
  formulaRow(
    "NRW rate(t-2) = [Total cost of water supply(t-2) / Forecast supply volume(t-2)] × NRW rate share(t-2)",
    "NRW rate(t-2) = [Total cost of water supply(t-2) / Forecast supply volume(t-2)] × NRW rate share(t-2)"
  ),
  spacerRow(),

  // ── APPENDIX A ─────────────────────────────────────────────────────────────
  headRow("الملحق أ — المسرد", "APPENDIX A — GLOSSARY"),
  row(
    "الإضافات الرأسمالية: التكلفة المتعلقة بإضافة أصول جديدة أو تحسين الأصول القائمة في المنشأة. أما الإصلاحات الهادفة إلى الحفاظ على صلاحية المعدات فتُعدّ صيانةً فحسب وليست إضافةً رأسمالية.",
    "Capital additions: the cost involved for adding new assets or improving existing assets within a business. Repairs made to maintain the usefulness of equipment are merely maintenance and not a capital addition.",
    {}
  ),
  row(
    "نفقات التشغيل المرسملة: إعادة توزيع نفقات التشغيل على نفقات رأس المال في نهاية كل عام. ويعكس ذلك حقيقة أن بعض نفقات التشغيل المرتبطة بتطوير أصول جديدة قد تكون لها منافع تمتد لما بعد السنة التي تكبَّد فيها المصروف.",
    "Capitalized OPEX: the reallocation of OPEX to CAPEX at the end of each year. This reflects the fact that some OPEX relating to the development of new assets may have benefits beyond the year in which the expense was incurred.",
    {}
  ),
  row(
    "الرقم القياسي لأسعار المستهلكين: مقياس للتضخم يعكس متوسط التغير في الأسعار التي يدفعها المستهلكون على مدار الزمن مقابل سلة من السلع والخدمات.",
    "Consumer price index: a measure of inflation, the average change in prices over time that consumers pay for a basket of goods and services.",
    {}
  ),
  row(
    "مساهمات المستفيدين: رسوم التوصيل المحصَّلة من المستفيدين كدفعة مقدمة مقابل خدمات لم يتم تقديمها بعد.",
    "Customer contributions: the connection charges received from customers as an advanced payment for services that have not yet been received.",
    {}
  ),
  row(
    "الإهلاك: تعويض عن الخسارة في القيمة الناجمة عن مرور الوقت وعوامل كالاستهلاك والتقادم التقني.",
    "Depreciation: compensation for the loss in value arising over time from factors such as wear and tear and technological change.",
    {}
  ),
  row(
    "نفقات التشغيل الاستثنائية: نفقات التشغيل التي يُسمح للشركة باستردادها من خلال متطلب إيرادها المسموح به والتي لا تُغطيها المنهجية بخلاف ذلك.",
    "Extraordinary OPEX: the OPEX which the company is allowed to recover through its permitted revenue requirement and is not otherwise captured within the methodology.",
    {}
  ),
  row(
    "الأصول الثابتة: الأصول اللازمة لتقديم الخدمة المنظَّمة والتي تُدرّ منافع على مدى فترات محاسبية متعددة.",
    "Fixed assets: assets required to provide the regulated service, which deliver benefits over multiple accounting periods.",
    {}
  ),
  row(
    "المنح الحكومية: مبالغ تمنحها جهة حكومية للشركة بغرض توظيفها لأغراض متفق عليها.",
    "Government grants: sum of money awarded by a government authority to the company in anticipation of it being applied for an agreed purpose.",
    {}
  ),
  row(
    "الفائدة خلال فترة الإنشاء: الفائدة المتراكمة لتمويل تطوير وإنشاء أصول مزود الخدمة قبل تشغيل الأصل.",
    "Interest during construction: interest that accumulates to finance the development and construction of a service provider's assets before the asset is commissioned.",
    {}
  ),
  row(
    "نفقات التشغيل: نفقات التشغيل والصيانة التي تتكبدها الشركة المنظَّمة.",
    "Operating expenditure: the operating and maintenance expenditure incurred by the regulated company.",
    {}
  ),
  row(
    "القيمة الفعلية: القيمة الحقيقية بعد تحقق حدث كان غير مؤكد في السابق.",
    "Outturn value: actual value once an event, which was previously uncertain, realizes.",
    {}
  ),
  row(
    "تكاليف الشفافية: التكاليف التي يُسمح للشركة باستردادها كاملةً لعدم قدرتها على التحكم فيها.",
    "Passthrough costs: costs that the company is allowed to recover in full as it has no control over these costs.",
    {}
  ),
  row(
    "دورة ضبط الأسعار: الفترة التي تسري خلالها المعاملات التنظيمية الثابتة المتعلقة بمتطلب إيراد الشركة المنظَّمة.",
    "Price control period: the period over which fixed regulatory parameters relating to a regulated company's revenue requirement will apply.",
    {}
  ),
  row(
    "الشركة المنظَّمة: الشركة الحاصلة على ترخيص من هيئة المياه السعودية لتقديم خدمات المياه للمستفيدين.",
    "Regulated company: the company that is licensed by the Saudi Water Authority to deliver a provision of water services to customers.",
    {}
  ),
  row(
    "قاعدة الأصول التنظيمية: القيمة المتبقية للأصول الواجب استردادها من خلال بدلات الإيراد المستقبلية، وتشمل الأصول المستخدمة والضرورية لتقديم الخدمة المنظَّمة فحسب.",
    "Regulatory asset base: remaining value of assets that needs to be recovered through future revenue allowances. It includes only those assets which have been used and are required to provide the regulated service.",
    {}
  ),
  row(
    "الإخراج من الخدمة: الأصل الذي لم يعد تحت سيطرة الشركة، أو لم يعد موجوداً، أو لم يعد قادراً على الاستخدام للغرض الذي اقتُني من أجله.",
    "Retirement: an asset which is no longer under the control of that company, no longer in existence, or no longer capable of being used in the manner for which the asset was originally acquired.",
    {}
  ),
  row(
    "العائد على الاستثمار: عناصر متطلب الإيراد التي تُتيح للشركة تطوير الأصول المنظَّمة وتشغيلها وصيانتها من خلال تحقيق عائد معقول على استثماراتها.",
    "Return on investment (RoI): the elements of the revenue requirement which allow the company to develop, operate and maintain the regulated assets through earning a reasonable return on their investment.",
    {}
  ),
  row(
    "تصحيح الإيراد: تعديل على متطلب الإيراد في سنة معينة، لمعالجة الفارق في السنة السابقة بين الإيراد الفعلي المحقَّق والإيراد المسموح به المُعدَّل بالقيم الفعلية للمعاملات غير المؤكدة المحددة مسبقاً.",
    "Revenue correction: an adjustment to the revenue requirement in a given year, to account for the difference in a preceding year between actual revenue earned and allowed revenue adjusted for outturn values of pre-defined uncertain parameter values.",
    {}
  ),
  row(
    "معامل المشاركة: معامل تُحدده هيئة المياه السعودية ويُعرِّف المستوى الذي يُسمح للشركة بالاحتفاظ به من الأداء المتفوق أو المتأخر في نفقات التشغيل.",
    "Sharing factor: a factor set by the Saudi Water Authority that defines the level of outperformance or underperformance on OPEX that the company is allowed to keep.",
    {}
  ),
  row(
    "التخزين الاستراتيجي للمياه: المياه الفائضة المخزَّنة والمتاحة للاستخدام عند انقطاع الإمدادات.",
    "Strategic water storage: excess water stored that is available to recover for use when supplies are disrupted.",
    {}
  ),
  row(
    "سعر نقل المياه: السعر المطبَّق على السلع والخدمات المنقولة بين شركات القطاع.",
    "Water transfer price: price for goods and services transferred between sector companies.",
    {}
  ),
  row(
    "المتوسط المرجح لتكلفة رأس المال: يعادل تكلفة الفرصة البديلة للاستثمار في الشركة.",
    "Weighted average cost of capital: equivalent to the opportunity cost of investing in the company.",
    {}
  ),
  row(
    "نظام المياه: المرسوم الملكي رقم م/159، بتاريخ 11/11/1441هـ.",
    "Water Law: Royal Decree No. M/159, dated 11/11/1441H.",
    {}
  ),
  row(
    "رأس المال العامل: رأس المال اللازم لتغطية التكاليف والالتزامات النقدية اليومية.",
    "Working capital: capital required to meet day-to-day cash costs and obligations.",
    {}
  ),
  spacerRow(),

  // ── APPENDIX B ─────────────────────────────────────────────────────────────
  headRow("الملحق ب — الاختصارات", "APPENDIX B — ABBREVIATIONS"),
  row(
    "AO: نفقات التشغيل المسموح بها\nCAPEX: نفقات رأس المال\nCAPM: نموذج تسعير الأصول الرأسمالية\nCoD: تكلفة الدين\nCoE: تكلفة حقوق الملكية\nCPI: الرقم القياسي لأسعار المستهلكين\nCS: تكاليف خدمة رأس المال\nCWIP: الأعمال قيد الإنشاء\nIDC: الفائدة خلال فترة الإنشاء\nIFRS: المعايير الدولية للتقارير المالية\nIMF: صندوق النقد الدولي\nKSA: المملكة العربية السعودية",
    "AO: Allowed OPEX\nCAPEX: Capital expenditure\nCAPM: Capital asset pricing model\nCoD: Cost of debt\nCoE: Cost of equity\nCPI: Consumer price index\nCS: Capital servicing costs\nCWIP: Construction work in progress\nIDC: Interest during construction\nIFRS: International Financial Reporting Standards\nIMF: International Monetary Fund\nKSA: Kingdom of Saudi Arabia",
    {}
  ),
  row(
    "Marafiq: شركة الكهرباء والمياه للجبيل وينبع\nMEWA: وزارة البيئة والمياه والزراعة\nMoF: وزارة المالية\nNBV: القيمة الدفترية الصافية\nNRW: المياه غير المدرة للإيراد\nNWC: الشركة الوطنية للمياه\nOPEX: نفقات التشغيل\nPTC: تكاليف الشفافية\nRAB: قاعدة الأصول التنظيمية\nRC: تصحيح الإيراد\nRR: متطلب الإيراد\nSAMA: البنك المركزي السعودي\nSAR: الريال السعودي\nSIO: المنظمة السعودية للري\nSWA: هيئة المياه السعودية\nSWCC: الشركة السعودية لتحلية المياه\nSWPC: شركة المياه السعودية للشراكة\nTSE: مياه الصرف الصحي المعالجة\nWACC: المتوسط المرجح لتكلفة رأس المال\nWBA: حساب موازنة المياه\nWC: رأس المال العامل\nWCP: فترة رأس المال العامل\nWEO: آفاق الاقتصاد العالمي\nWTTCO: شركة نقل ومعالجة المياه",
    "Marafiq: Power and Water Utility Company for Jubail and Yanbu\nMEWA: Ministry of Environment, Water and Agriculture\nMoF: Ministry of Finance\nNBV: Net book value\nNRW: Non-revenue water\nNWC: National Water Company\nOPEX: Operating expenditure\nPTC: Passthrough costs\nRAB: Regulatory asset base\nRC: Revenue correction\nRR: Revenue requirement\nSAMA: Saudi Central Bank\nSAR: Saudi Riyal\nSIO: Saudi Irrigation Organization\nSWA: Saudi Water Authority\nSWCC: Water Desalination\nSWPC: Saudi Water Partnership Company\nTSE: Treated sewage effluent\nWACC: Weighted average cost of capital\nWBA: Water Balancing Account\nWC: Working capital\nWCP: Working capital period\nWEO: World Economic Outlook\nWTTCO: Water Transmission and Technologies Company",
    {}
  ),
];

// ─── Build document ──────────────────────────────────────────────────────────

const mainTable = new Table({
  rows: tableRows,
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: NONE_BORDER,
    bottom: NONE_BORDER,
    left: NONE_BORDER,
    right: NONE_BORDER,
    insideHorizontal: NONE_BORDER,
    insideVertical: NONE_BORDER,
  },
  layout: "fixed",
});

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4 in twips
          margin: { top: 1440, bottom: 1440, left: 720, right: 720 },
        },
      },
      children: [mainTable],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  const stats = fs.statSync(OUTPUT_PATH);
  console.log("SUCCESS: Document written to", OUTPUT_PATH);
  console.log("File size:", (stats.size / 1024).toFixed(1), "KB");
});
