const fs = require('fs')
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx')

const BLACK = '000000'
const FONT_BODY = '宋体'
const FONT_HEAD = '黑体'

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
    },
    children: [
      // ===== 标题 =====
      p('知维图谱：基于大语言模型的概念知识图谱构建工具', {
        align: AlignmentType.CENTER, size: 32, font: FONT_HEAD, bold: true, after: 0,
      }),
      p('——面向教师的概念生态分析与教学辅助系统', {
        align: AlignmentType.CENTER, size: 24, font: FONT_BODY, after: 200,
      }),

      // ===== 摘要 =====
      p([
        run('摘要：', { bold: true, size: 21 }),
        run('知维图谱是一款面向中小学教师的桌面端教育应用。系统以概念转变理论和有意义学习理论为基础，利用大语言模型（LLM）的语义理解与生成能力，辅助教师在备课时系统化梳理学科概念知识体系，并通过智能体对话交互实现概念图谱的半自动化构建。系统采用 Electron + React + D3.js 技术栈，所有数据本地存储，打包为 Windows 桌面应用分发。', { size: 21 }),
      ], { after: 40 }),
      p([
        run('关键词：', { bold: true, size: 21 }),
        run('概念图谱；大语言模型；教师备课工具；概念转变理论；认知冲突', { size: 21 }),
      ], { after: 240 }),

      // ================================================================
      // 一
      // ================================================================
      h1('一、所解决的教育痛点和问题'),

      h2('1.1 教师备课时概念体系构建的认知负荷'),
      body('在日常教学实践中，教师在备课时需要完成一项关键但常被忽视的认知任务：梳理本单元所涉及的概念及其相互关联。以初中物理"力学"单元为例，教师在讲授"加速度"这一新概念之前，需要明确学生已掌握哪些先备知识（位置、位移、速度、时间等），这些先备概念之间存在怎样的逻辑关系（前提关系、上下位关系、类比关系等），以及新概念的引入可能引发学生哪些认知冲突（Barron & Darling-Hammond, 2008）。Shulman（1986）提出的"学科教学知识"（Pedagogical Content Knowledge, PCK）理论指出，优秀教师区别于学科专家的关键不在于掌握了更多学科知识，而在于能够将学科知识转化为适合学生理解的表征形式。然而，在当前的教师培训和教学实践中，概念体系的梳理几乎完全依赖教师的个体经验和隐性知识，新教师和跨学科教师往往缺乏有效的方法论指导和工具支撑。'),

      h2('1.2 学生迷思概念的识别与教学干预的滞后性'),
      body('教育心理学研究表明，学生在正式学习科学概念之前，已经通过日常生活经验形成了大量"前概念"（preconceptions）或"朴素理论"（Vosniadou, 1994）。这些前概念中，相当一部分与科学概念存在偏差甚至直接矛盾，被称为"迷思概念"（misconceptions）。例如，在物理学中，许多学生持有"力是维持运动的原因"这一亚里士多德式的直觉信念；在学习"加速度"时，学生常将"加速度"与日常语言中的"加速"混为一谈，忽略减速也是加速度的一种表现（diSessa, 1993）。传统的教学实践中，教师通常是在考试或作业批改后才"发现"学生存在这些迷思概念，此时教学已经完成，只能通过补救性教学来纠正。这种"滞后性干预"模式的问题在于，迷思概念一旦形成具有较强的认知顽固性，事后纠正的成本远高于事前预防。'),

      h2('1.3 教育智能化浪潮中教师角色的边缘化倾向'),
      body('近年来，以生成式人工智能为代表的教育技术应用呈井喷式发展。然而大量产品将 AI 定位为"替代教师的教学者"——AI 给学生讲课、AI 给学生出题、AI 给学生批改——教师在技术架构中越来越边缘化（Selwyn, 2019）。这种"去教师化"的技术路线不仅与教育学的基本规律相悖，也引发了教师群体对教育技术的抵触情绪。我们认为，教育 AI 的正确方向不应该是"替代教师去教学生"，而应该是"辅助教师更好地教"。知维图谱正是基于这一理念设计的：它不直接面向学生，而是面向教师的备课环节，帮助教师更高效、更系统地完成概念知识体系的梳理和新概念引入的教学设计。'),

      // ================================================================
      // 二
      // ================================================================
      h1('二、现有相关教育应用的现状调研'),

      h2('2.1 传统概念图工具'),
      body('概念图（Concept Map）是 Novak 和 Gowin（1984）基于奥苏贝尔的有意义学习理论提出的一种知识可视化工具。目前市面上的代表性产品包括 CmapTools 和 XMind。CmapTools 由佛罗里达人类与机器认知研究所开发，支持多人在线协作编辑概念图；XMind 则内置多种图形模板，界面美观，导出格式丰富。然而，这些传统工具存在一个共同局限：它们本质上是"画图工具"——提供的是图形编辑能力，而非知识分析能力。概念之间的关系类型、体系的完整性、迷思概念的识别，都需要用户自行判断和手动填充，工具本身不提供任何智能化的分析支持。对于时间有限的教师而言，在备课时使用这类工具反而增加了额外的工作负担。'),

      h2('2.2 AI 教学辅助平台'),
      body('2024 年以来，一批面向教育的 AI 应用开始涌现。清华大学的 OpenMAIC（Open Multi-Agent Interactive Classroom）是一个典型代表——它利用多智能体架构实现了 AI 教师、AI 助教和 AI 同学的协同互动，能够根据输入的主题自动生成完整的课堂教学内容（于济凡 等, 2025）。该平台已在清华大学真实课堂中进行了大规模测试，日活用户超过 5 万。然而，OpenMAIC 的核心定位是"AI 驱动的课堂教学交付系统"——它关注的是"如何由 AI 来讲课"，而非"如何帮助教师理解学生在学习新概念时的认知过程"。此外，商业化的 AI 教育产品如 Khan Academy 的 Khanmigo、Duolingo Max 等，主要集中在自适应学习和个性化辅导领域，面向学生端；国内科大讯飞、好未来等企业的 AI 产品也主要聚焦于智能批改、自适应题库、语音评测等领域，缺乏面向教师概念教学设计的专业工具。'),

      h2('2.3 知识图谱与认知图谱的差距'),
      body('知识图谱技术在教育领域已有初步探索，如 KnowEdu 项目构建了学科知识点之间的先后修关系，用于自适应学习系统的学习路径规划（Chen et al., 2018）。但这类知识图谱通常由教育专家手动构建，工程浩大、更新成本高，且描述的是"客观的知识体系"而非"学生头脑中的认知结构"。学习者的"认知图谱"与传统的学科知识图谱有本质区别：后者描述的是"应该是什么"，前者描述的是"学生以为是什么"——必须考虑学生的概念掌握水平、前概念偏差和迷思概念分布等个体化认知特征。这种从"客观知识结构"到"主观认知结构"的视角转换，是将认知科学理论融入教育技术产品的关键，也是目前市面上几乎所有产品都未能触及的空白地带。'),

      // ================================================================
      // 三
      // ================================================================
      h1('三、教育应用设计的关键技术和理论基础'),

      h2('3.1 理论框架'),
      body('皮亚杰（Piaget, 1952）的认知发展理论提出了"同化"（assimilation）和"顺应"（accommodation）两种认知机制。同化是指将新信息纳入已有认知图式中而不改变其结构；顺应则是指当新信息与已有图式产生根本矛盾时，个体必须重组已有图式。教师在引入新概念时，需要判断该概念可以通过"同化"平滑整合，还是必须引发"顺应"式的认知重构。'),
      body('概念转变理论（Posner et al., 1982）进一步提出了概念转变的四个条件：对已有概念产生"不满"（dissatisfaction），新概念需具备"可理解性"（intelligibility）、"合理性"（plausibility）和"丰富性"（fruitfulness）。Chi（1992）的"本体论错位"理论则解释了为何某些概念转变特别困难——学生将概念归属到了错误的本体论类别（如将"力"归为"物体的属性"而非"相互作用"）。'),
      body('奥苏贝尔（Ausubel, 1968）的有意义学习理论强调，影响学习最重要的单一因素是学习者已经知道什么，教师应" ascertain this and teach him accordingly"。新知识必须通过实质性的、非任意的方式与已有认知结构建立联系。变易理论（Marton & Booth, 1997）则指出，学习者必须通过"对比"来辨识概念的关键特征，教师需要精心设计"变"与"不变"的对比情境。'),
      body('基于上述理论，知维图谱将新概念引入的分析维度设计为：（1）同化锚点——可作为新知识基础的已有概念及其类比桥梁；（2）认知冲突——已有概念体系中与新概念矛盾的内容及可能的迷思概念；（3）认知重构——需要发生根本性概念转变的节点；（4）难度预测与教学策略建议。LLM 的 System Prompt 将上述理论框架编码为分析指令，使其在分析时扮演"认知心理学家"的角色。'),

      h2('3.2 技术架构'),
      body('系统采用 Electron + React + TypeScript + D3.js 技术栈，整体架构分为三层。表示层基于 React 18 构建用户界面，采用 iOS 风格的极简设计语言，使用 D3.js v7 实现概念图谱的力导向图可视化，图谱采用颜色编码系统（绿色=同化锚点、红色=认知冲突、蓝色=激活概念、紫色=新概念、橙色=需重构概念）。业务逻辑层基于 Node.js 运行环境，负责本地 JSON 文件系统的读写操作、LLM API 的流式调用、以及智能体工具调用循环。数据层中每个项目为一个独立的 JSON 文件，存储在用户文档目录下的 ConceptEcology/projects/ 中。'),
      body('系统通过 LLM API 实现两类核心智能功能。概念生态模拟功能由教师输入"待学新概念"，系统将已有概念体系摘要发送给 LLM，返回结构化的 JSON 分析结果。智能体对话交互（"小知"助手）采用自实现的工具调用机制——将知识库操作工具（添加、删除、更新概念，建立关系，查看全库）的描述嵌入 System Prompt，LLM 通过输出 <tool> XML 标签触发工具调用，后端解析后直接执行本地文件操作并返回结果。这一设计不依赖特定 LLM API 的原生 Function Calling 特性，兼容 Anthropic、OpenAI、DeepSeek 等多种模型。'),
      body('与传统的 Web 应用不同，知维图谱选择桌面端部署方案。所有数据存储于用户本地文档目录，不依赖任何云数据库，消除了数据隐私泄露风险。桌面应用可在大部分功能离线使用，打包后可直接分发，降低了教师的使用门槛。'),

      // ================================================================
      // 四
      // ================================================================
      h1('四、不足与展望'),

      h2('4.1 当前局限'),
      body('LLM 分析质量高度依赖模型推理能力，不同模型（如 Claude、GPT-4o、DeepSeek-Chat）的分析深度和准确度存在显著差异，且 LLM 的"幻觉"问题可能导致分析结果中出现不准确的概念关系或虚构的迷思概念，系统目前缺乏对 LLM 输出的后置校验机制。当前 Prompt 设计主要面向理科中概念层次分明、逻辑关系清晰的知识体系，对文史类学科中概念边界模糊的结构验证不足。系统对认知冲突和难度的预测完全基于 LLM 的先验知识推理，尚未接入真实学生数据进行验证和校准，分析结果的准确性无法通过实证方式确认。概念图谱的初始构建需要教师投入前置工作量，可能构成使用门槛。界面在协同管理、图谱导出格式、布局算法优化等方面仍有改进空间。'),

      h2('4.2 未来展望'),
      body('未来可从以下几个方面进行改进。一是引入学科领域自适应机制，根据不同学科自动调整概念分析的理论框架和 Prompt 策略，理科侧重层级与因果、文科侧重语义与视角。二是在授权前提下接入学生诊断性测试和概念图作业等数据，将 LLM 预测与学生实际表现进行对照校准，逐步将系统从"推测工具"升级为"实证决策支持系统"。三是扩展为支持同校教师团队共享图谱的协作教研平台，形成学校层面的知识资产积累。四是与主流学习管理系统（如 Moodle、超星学习通等）的 API 对接，实现教学数据的自动导入，真正融入教师的日常工作流。五是探索语音输入、手绘草图等多模态交互方式，进一步降低使用门槛，提供更自然的交互体验。'),

      // ================================================================
      // 参考文献
      // ================================================================
      h1('参考文献'),
      ref('[1] Barron, B., & Darling-Hammond, L. (2008). Teaching for meaningful learning: A review of research on inquiry-based and cooperative learning. Edutopia.'),
      ref('[2] Shulman, L. S. (1986). Those who understand: Knowledge growth in teaching. Educational Researcher, 15(2), 4-14.'),
      ref('[3] Vosniadou, S. (1994). Capturing and modeling the process of conceptual change. Learning and Instruction, 4(1), 45-69.'),
      ref('[4] diSessa, A. A. (1993). Toward an epistemology of physics. Cognition and Instruction, 10(2-3), 105-225.'),
      ref('[5] Selwyn, N. (2019). Should robots replace teachers? AI and the future of education. Polity Press.'),
      ref('[6] Novak, J. D., & Gowin, D. B. (1984). Learning how to learn. Cambridge University Press.'),
      ref('[7] 于济凡, 邵文泽, 刘知远. (2025). OpenMAIC：开放多智能体互动课堂平台的技术架构与教育应用. 现代教育技术, 35(3), 1-12.'),
      ref('[8] Chen, P., Lu, Y., Zheng, V. W., et al. (2018). KnowEdu: A system to construct knowledge graph for education. IEEE Access, 6, 31553-31563.'),
      ref('[9] Piaget, J. (1952). The origins of intelligence in children. International Universities Press.'),
      ref('[10] Posner, G. J., Strike, K. A., Hewson, P. W., & Gertzog, W. A. (1982). Accommodation of a scientific conception: Toward a theory of conceptual change. Science Education, 66(2), 211-227.'),
      ref('[11] Chi, M. T. H. (1992). Conceptual change within and across ontological categories. In R. N. Giere (Ed.), Cognitive models of science (pp. 129-186). University of Minnesota Press.'),
      ref('[12] Ausubel, D. P. (1968). Educational psychology: A cognitive view. Holt, Rinehart and Winston.'),
      ref('[13] Marton, F., & Booth, S. (1997). Learning and awareness. Lawrence Erlbaum Associates.'),
    ],
  }],
})

// ===== 辅助函数 =====

function p(textOrRuns, opts = {}) {
  let children
  if (typeof textOrRuns === 'string') {
    children = [run(textOrRuns, opts)]
  } else {
    children = textOrRuns
  }
  return new Paragraph({
    spacing: { after: opts.after ?? 80, line: opts.line ?? 360 },
    alignment: opts.align,
    indent: opts.indent ? { firstLine: opts.indent } : undefined,
    children,
  })
}

function h1(text) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, font: FONT_HEAD, color: BLACK })],
  })
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 180, after: 60 },
    children: [new TextRun({ text, bold: true, size: 24, font: FONT_HEAD, color: BLACK })],
  })
}

function body(text) {
  return new Paragraph({
    spacing: { after: 80, line: 360 },
    indent: { firstLine: 480 },
    children: [new TextRun({ text, size: 24, font: FONT_BODY, color: BLACK })],
  })
}

function run(text, opts = {}) {
  return new TextRun({
    text,
    size: opts.size ?? 24,
    font: opts.font ?? FONT_BODY,
    bold: opts.bold ?? false,
    color: BLACK,
  })
}

function ref(text) {
  return new Paragraph({
    spacing: { after: 24, line: 300 },
    children: [new TextRun({ text, size: 20, font: FONT_BODY, color: BLACK })],
  })
}

// ===== 输出 =====
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('项目报告.docx', buffer)
  console.log('项目报告.docx 生成成功')
})
