PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    category TEXT,
    organization TEXT,
    tags TEXT, -- JSON string array
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    download_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  , date TEXT, conference_id INTEGER REFERENCES conferences(id));
INSERT INTO reports VALUES(3,'GAME 회의 동향 분석 보고서','요약없음','내용도 없음.','품질 평가','IEEE','["엄써"]',NULL,NULL,NULL,NULL,NULL,'2025-08-16 02:12:17','2025-08-16 02:12:17','2025-08-16',13);
INSERT INTO reports VALUES(4,'과거 테스트 회의 동향 분석 보고서','아따 거서기 허요',replace('워미 씨불꺼\n\n병신들 병신잔치한거지\n\n지랄 옘병 똥 쌈싸쳐먹고 자빠진네','\n',char(10)),'시스템 아키텍처','ISO/IEC','["태그","디스이즈스파르타"]',NULL,NULL,NULL,NULL,NULL,'2025-08-16 02:33:09','2025-08-16 02:33:09','2025-08-16',14);
INSERT INTO reports VALUES(5,'MSF 회의 동향 분석 보고서',replace('- Metaverse Standards Forum의 AI x Metaverse 탐색 그룹 4차 회의에서 워킹 그룹 헌장 승인 및 가상 세계 내 자율 에이전트 통합을 위한 두 가지 핵심 유스케이스 제시\n- 메타버스 환경에서 AI 에이전트의 자율적 상호작용과 결제 시스템 구축을 위한 표준화 작업의 기초 마련\n- OMA3, YOLOgram, Versemaker, Siemens, Qualcomm 등 주요 기업들의 참여로 산업 표준 개발에 대한 강력한 이해관계자 연합 형성','\n',char(10)),replace('## Abstract\n\n- Metaverse Standards Forum의 AI x Metaverse 탐색 그룹 4차 회의에서 워킹 그룹 헌장 승인 및 가상 세계 내 자율 에이전트 통합을 위한 두 가지 핵심 유스케이스 제시\n- 메타버스 환경에서 AI 에이전트의 자율적 상호작용과 결제 시스템 구축을 위한 표준화 작업의 기초 마련\n- OMA3, YOLOgram, Versemaker, Siemens, Qualcomm 등 주요 기업들의 참여로 산업 표준 개발에 대한 강력한 이해관계자 연합 형성\n\n## Summary\n\n- 2025년 8월 4일 개최된 AI x Metaverse 탐색 그룹 4차 회의는 워킹 그룹으로의 전환을 위한 중요한 전환점이 되었다. 회의에서는 Causeway 온라인 투표를 통해 워킹 그룹 헌장이 10명의 투표 자격자 중 9명의 찬성으로 승인되어 정식 워킹 그룹 설립의 기반을 마련했다.\n- 가상 세계 내 자율 에이전트 통합 유스케이스가 Digital Asset Management 워킹 그룹에서 제안되었으며, 이는 AI 기반 시스템이 3D 몰입형 환경에서 사용자처럼 행동할 수 있도록 하는 프로토콜과 API 개발을 목표로 한다. Model Context Protocol(MCP)이 이러한 표준화의 핵심 기술로 제시되었다.\n- 자율 결제 시스템 유스케이스는 OMA3에서 진행 중인 프로젝트로 소개되었으며, AI 에이전트가 메타버스 환경에서 인간의 개입 없이 독립적으로 상품과 서비스를 구매할 수 있는 시스템을 다룬다. Coinbase의 X402 프로토콜과 Mastercard의 Asian Pay 등 기존 기술들이 참조 구현으로 언급되었다.\n- 차세대 워킹 그룹 회의는 2025년 8월 18일로 예정되어 있으며, 이때부터 본격적인 표준 개발 작업이 시작될 예정이다. 회의 참석자들은 두 유스케이스 모두에 대해 긍정적인 반응을 보였으며, 특히 메타버스와 AI의 교차점에서 실질적인 표준화 작업의 필요성에 동의했다.\n\n## Technical Details\n\n### 회의 거버넌스 및 절차\n\n- Metaverse Standards Forum 규정 준수\nMSF의 모든 회의는 독점금지법 및 경쟁법을 포함한 모든 적용 법률을 준수하며 진행되었다. 특허 및 특허 청구항의 해석, 유효성, 필수성에 대한 논의는 금지되며, 구체적인 라이선스 요율, 조건, 제품 가격 고정, 고객 할당, 시장 분할에 대한 논의도 제한된다.\n- 투표 시스템 및 쿼럼 관리\n헌장 승인을 위해 Causeway 온라인 투표 시스템을 활용했으며, 최근 3회 AIM 회의 중 2회 이상 참석한 회사들에게 투표권을 부여했다. 총 10개 투표 자격 회사 중 9개 회사가 찬성표를 던져 헌장이 승인되었으며, 기권은 없었다.\n- 자동 출석 추적 시스템\nZoom에서 ''Your Company: Your Name'' 형식으로 이름을 변경하여 자동 출석 추적을 시도했으나, 시스템의 정확도가 낮아 향후 정식 워킹 그룹에서는 수동 출석 기록이 필요할 것으로 판단된다.\n\n### 가상 세계 내 자율 에이전트 통합 기술\n\n- Model Context Protocol(MCP) 표준화\n가상 세계를 API 엔드포인트로 간주할 때, MCP가 에이전트가 해당 엔드포인트를 활용할 수 있게 하는 표준의 선두주자로 제시되었다. MCP 레지스트리들이 존재하여 사람들이 MCP 서버를 발견할 수 있도록 지원하며, 이는 에이전트의 가상 세계 접근성을 크게 향상시킬 것으로 예상된다.\n- 3D 몰입형 환경 상호작용 메커니즘\nVR 글래스, AR 글래스, 컴퓨터, 스마트폰 등 다양한 디바이스를 통해 접근 가능한 3D 몰입형 환경에서 에이전트가 키보드와 마우스 대신 자연스러운 상호작용을 수행할 수 있도록 하는 프로토콜 개발이 핵심이다.\n- 기존 구현 사례 분석\nLua for Roblox, Project Malmo for Minecraft, Unity Machine Learning Agents 등 하드코딩된 구현 사례들이 존재하며, 이들을 표준화된 접근 방식으로 통합하는 것이 목표다. Toyota의 Woven City 프로젝트도 실제 활용 사례로 언급되었다.\n\n### 자율 결제 시스템 아키텍처\n\n- X402 프로토콜 기반 결제 표준\nCoinbase에서 2025년 5월 발표한 X402 프로토콜은 Bitcoin Lightning Network를 활용한 L402 프로토콜의 발전된 형태로, AI 에이전트의 자율적 결제를 위한 핵심 기술로 평가된다. 이 프로토콜은 소액 결제부터 대규모 거래까지 다양한 결제 시나리오를 지원한다.\n- 금융 중개자 통합 메커니즘\n에스크로 제공업체나 신용카드 발급업체 같은 선택적 금융 중개자의 활용을 통해 분쟁 해결 및 신용 기반 거래를 지원한다. Mastercard의 Asian Pay 시스템도 이러한 중개 역할을 수행할 수 있는 기술로 제시되었다.\n- 다중 결제 레일 지원 시스템\n독점 네트워크, 공개 블록체인 네트워크 등 다양한 결제 레일을 지원하여 에이전트가 상황에 따라 최적의 결제 방식을 선택할 수 있도록 설계되었다. 이는 거래 비용 최적화와 처리 속도 향상에 기여한다.\n\n### 위험 요소 및 도전 과제\n\n- 기술적 호환성 문제\n다양한 가상 세계 플랫폼과 AI 에이전트 시스템 간의 호환성 확보가 주요 기술적 과제로 제기되었다. 표준화된 API와 프로토콜 없이는 에이전트의 크로스 플랫폼 작동이 어려울 수 있다.\n- 보안 및 프라이버시 고려사항\n자율 에이전트의 결제 권한과 개인정보 처리에 대한 보안 프레임워크 구축이 필요하다. 특히 에이전트가 사용자를 대신하여 금융 거래를 수행할 때의 책임 소재와 보안 정책이 중요한 이슈다.\n- 윤리적 및 사회적 위험 관리\nAI 에이전트의 자율적 행동이 금융 시장 불안정성을 야기할 가능성과 사용자 데이터 활용에 따른 사회적 위험을 별도로 분류하여 관리해야 한다는 의견이 제시되었다.\n\n## Additional Information\n\n- Metaverse Standards Forum은 메타버스 기술의 상호 운용성과 표준화를 촉진하기 위해 설립된 산업 표준 기구로, 주요 기술 기업들이 참여하여 오픈 표준 개발을 추진한다. 이 포럼은 상세한 사양 설계 논의를 직접 주최하지 않으며, 표준 정의 기구들이 자체 거버넌스와 IP 정책 하에서 논의를 진행하도록 조율 역할을 수행한다.\n- OMA3(Open Metaverse Alliance for Web3)는 웹3 기반 메타버스의 개방성과 상호 운용성을 촉진하는 연합체로, Upland 등의 가상 부동산 플랫폼을 운영하는 기업들이 참여하고 있다. 이들은 가상 자산 거래와 소유권 관리에 대한 실질적인 경험을 바탕으로 표준 개발에 기여한다.\n- Digital Asset Management 워킹 그룹은 메타버스 내 디지털 자산의 생성, 관리, 거래를 위한 표준을 개발하는 MSF의 핵심 워킹 그룹 중 하나로, AI 에이전트와 디지털 자산 간의 상호작용 표준화에 중요한 역할을 담당한다.\n\n## Recommended Action Items\n\n- Model Context Protocol 기반 가상 세계 통합 표준 개발 연구\n현재 진행 중인 연구 주제와 관련하여 MCP를 활용한 AI 에이전트의 가상 세계 접근 표준화 방안을 심층 연구할 필요가 있다. 특히 기존의 하드코딩된 구현체들을 표준화된 접근 방식으로 통합하는 방법론을 개발하고, 다양한 가상 세계 플랫폼에서의 호환성 테스트를 수행해야 한다. 이는 메타버스 생태계의 상호 운용성 확보와 직접적으로 연관된다.\n- 자율 결제 시스템의 보안 프레임워크 구축 방안 연구\nAI 에이전트의 자율적 결제 기능 구현 시 발생할 수 있는 보안 위험을 체계적으로 분석하고, 이를 완화할 수 있는 기술적 해결책을 연구해야 한다. X402 프로토콜과 같은 기존 기술의 보안 특성을 평가하고, 메타버스 특화 보안 요구사항을 도출하여 포괄적인 보안 아키텍처를 설계하는 것이 필요하다.\n- 크로스 플랫폼 AI 에이전트 상호 운용성 표준화 연구\n다양한 메타버스 플랫폼과 AI 에이전트 시스템 간의 호환성을 보장하는 표준화 방안을 연구해야 한다. 이는 에이전트의 신원 인증, 능력 발견, 통신 프로토콜 등을 포괄하는 종합적인 접근이 필요하며, 기존 웹 표준과의 연계성도 고려해야 한다.\n\n## References\n\n- Metaverse Standards Forum AI x Metaverse Exploratory Group Meeting #4 Presentation Materials\n- AI x Metaverse EG Meeting 4 Minutes (August 4, 2025)\n- Digital Asset Management Autonomous Agents in Virtual Worlds Use Case Documentation\n- Autonomous Payments Use Case Documentation (OMA3)\n- Causeway Ballot System Charter Approval Results\n\n## Midjourney Prompt\n\n`A futuristic conference room with holographic displays showing AI agents interacting in virtual worlds, diverse tech professionals from global companies collaborating around a translucent table with floating 3D metaverse environments and payment system diagrams, sleek modern architecture with blue and teal accent lighting, digital art style, wide angle 16:9 composition --ar 16:9 --v 6`','\n',char(10)),'시스템 아키텍처','MSF','["msf","ai"]',NULL,NULL,NULL,NULL,NULL,'2025-08-16 02:44:55','2025-08-17 04:26:52','2025-08-16',15);
INSERT INTO reports VALUES(9,'2025년 1월 전략 회의 (예시1) 동향 분석 보고서','뭐 없지','쥐뿔도 없지 머','콘텐츠 및 상호작용','3GPP','[]',NULL,NULL,NULL,NULL,NULL,'2025-08-17 04:20:31','2025-08-17 04:20:31','2025-08-17',16);
CREATE TABLE IF NOT EXISTS "conferences" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        organization TEXT NOT NULL,
        location TEXT,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_multi_day INTEGER DEFAULT 0,
        start_time TEXT,
        end_time TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
INSERT INTO conferences VALUES(2,'ISO/IEC JTC 1/SC 24 Ad Hoc 2 메타버스 회의','ISO/IEC','OSCC','666','2025-08-18','2025-08-22',1,NULL,NULL,'2025-08-15 15:15:43','2025-08-15 15:27:43');
INSERT INTO conferences VALUES(3,'SG21','ITU-T','geneva','','2025-10-12','2025-10-26',1,NULL,NULL,'2025-08-15 15:24:03','2025-08-15 15:53:25');
INSERT INTO conferences VALUES(4,'SG11','ITU-T','OSCC','666','2025-08-19','2025-08-21',1,NULL,NULL,'2025-08-15 15:28:53','2025-08-16 15:07:35');
INSERT INTO conferences VALUES(12,'MSF AIM WG #1','MSF','online','','2025-08-26','2025-08-26',0,'00:00','01:00','2025-08-15 15:55:16','2025-08-16 17:48:41');
INSERT INTO conferences VALUES(13,'GAME 회의','IEEE','ggg','11','2025-03-20','2025-03-24',1,NULL,NULL,'2025-08-15 16:30:34','2025-08-16 11:19:53');
INSERT INTO conferences VALUES(14,'과거 테스트 회의','ISO/IEC','테스트 장소','드롭다운 테스트용 과거 회의','2024-12-01','2024-12-02',1,NULL,NULL,'2025-08-15 16:30:47','2025-08-15 16:30:47');
INSERT INTO conferences VALUES(15,'MSF 회의','기타','온라인','뭐... ','2025-08-04','2025-08-04',0,'00:00','01:00','2025-08-16 02:43:23','2025-08-16 11:19:53');
INSERT INTO conferences VALUES(16,'2025년 1월 전략 회의 (예시1)','3GPP','서울 코엑스, 온라인','','2025-02-05','2025-02-08',1,NULL,NULL,'2025-08-17 02:24:15','2025-08-17 03:06:56');
CREATE TABLE organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );
INSERT INTO organizations VALUES(1,'MSF');
INSERT INTO organizations VALUES(2,'ITU-T');
INSERT INTO organizations VALUES(3,'ISO');
INSERT INTO organizations VALUES(4,'IEC');
INSERT INTO organizations VALUES(5,'ISO&IEC');
INSERT INTO organizations VALUES(6,'ISO/IEC JTC 1');
INSERT INTO organizations VALUES(7,'Khronos');
INSERT INTO organizations VALUES(8,'W3C');
INSERT INTO organizations VALUES(9,'IETF');
INSERT INTO organizations VALUES(10,'ETSI');
INSERT INTO organizations VALUES(11,'3GPP');
INSERT INTO organizations VALUES(12,'IEEE');
CREATE TABLE tech_analysis_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  , title TEXT NOT NULL DEFAULT '', image_url TEXT, category_id INTEGER REFERENCES categories(id), category_name TEXT);
INSERT INTO tech_analysis_reports VALUES(3,'https://www.yoginsoft.com/127','주요 요약MCP(Model Context Protocol)는 AI 어시스턴트, 특히 대형 언어 모델(LLM)이 외부 데이터와 도구에 연결되도록 돕는 개방형 표준으로 보입니다. GIS 분야에서는 ArcGIS 위치 서비스와 같은 공간 데이터를 AI가 쉽게 사용할 수 있도록 MCP 서버가 활용됩니다. MCP 서버 소개: 모델 컨텍스트 프로토콜을 통한 AI 강화MCP란 무엇인가요?MCP(Model Context Protocol)는 Anthropic에서 개발한 개방형 표준으로, AI 어시스턴트, 특히 대형 언어 모델(LLM)이 외부 데이터 소스와 도구에 연결되도록 돕습니다. 현재 AI 모델은 실시간 데이터에 접근하기 어려운 경우가 많아 정보 격벽에 갇혀 있는 경우가 많습니다. MCP는 콘텐츠 저장소, 비즈니스…','2025-08-16 18:17:17','GIS 분야에서 모델 컨텍스트 프로토콜(MCP)을 통한 AI 강화 소개','https://img1.daumcdn.net/thumb/R800x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2Fbmiq0p%2FbtsM9n0tH5D%2FAAAAAAAAAAAAAAAAAAAAANoVd_v7tC6JX7-UiBn5OtHs-oC5R-XH_Xsq5908o__h%2Ftfile.svg%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1756652399%26allow_ip%3D%26allow_referer%3D%26signature%3D0kaUJEK3Ne%252F3Ggne532V8QMhgME%253D',NULL,NULL);
INSERT INTO tech_analysis_reports VALUES(4,'https://arrival.space/','Your 3D space on the web','2025-08-16 18:17:37','Arrival.Space - claim. edit. share.','https://claim.arrival.space/wp-admin/admin-ajax.php?action=rank_math_overlay_thumb&id=2961&type=play&hash=2da92cc254081a16cbf0cabd19028376',NULL,NULL);
INSERT INTO tech_analysis_reports VALUES(6,'https://github.com/Lightricks/LTX-Video?utm_source=www.therundown.ai&utm_medium=newsletter&utm_campaign=ai-video-breaks-the-60-second-barrier&_bhlid=d5c0955159e51abfaf339e8b8eafdcad1166a526','Official repository for LTX-Video. Contribute to Lightricks/LTX-Video development by creating an account on GitHub.','2025-08-16 18:18:39','GitHub - Lightricks/LTX-Video: Official repository for LTX-Video','https://opengraph.githubassets.com/1fe9da6e16d5d88a1bfd5a6c9de6dcea6349ca592effc43b209cfe1cf82ebf44/Lightricks/LTX-Video',NULL,NULL);
INSERT INTO tech_analysis_reports VALUES(7,'https://www.uploadvr.com/meta-squeezeme-mobile-ready-distillation-of-gaussian-full-body-avatars/','Meta distilled its full-body Codec Avatars tech to render 3 at once on Quest 3 standalone, with some notable tradeoffs.','2025-08-17 04:16:12','Meta Got 3 Full-Body Codec Avatars Running On Quest 3','https://www.uploadvr.com/content/images/size/w1200/2025/08/Meta-SqueezeMe-distilled-full-body-Codec-Avatars.png',NULL,NULL);
INSERT INTO tech_analysis_reports VALUES(8,'https://www.nianticspatial.com/blog/niantic-spatial-sdk-meta-quest-3-passthrough-camera-api','Niantic Spatial SDK v3.15 now supports Meta Quest 3 with immersive mixed reality features powered by Meta’s Passthrough Camera API—including VPS, meshing, semantics, and object detection.','2025-08-17 04:16:30','Niantic Spatial SDK Brings Immersive Reality to Meta Quest 3 with the Passthrough Camera API | Niantic Spatial, Inc.','https://lh3.googleusercontent.com/nrJey5tiuvs4IcDmAedVYiE3mnZI51WxPvZPvaA5Ws6sUOojxZd-uFdU9X_FBYExIiQxCYjDOmX4oSpm9yfpJGtUJP7I2jRcZQ',NULL,NULL);
INSERT INTO tech_analysis_reports VALUES(9,'https://github.com/ali-vilab/VACE','Official implementations for paper: VACE: All-in-One Video Creation and Editing - ali-vilab/VACE','2025-08-17 06:12:29','GitHub - ali-vilab/VACE: Official implementations for paper: VACE: All-in-One Video Creation and Editing','https://opengraph.githubassets.com/b7fd3ebcbfe021d91dc0d9bfb8e4caf0a9ea2afc9f00bfbcb4ce2de0058b08b9/ali-vilab/VACE',NULL,NULL);
INSERT INTO tech_analysis_reports VALUES(12,'https://medium.com/@snehalsingh.0407/i-used-firecrawl-gpt-n8n-to-build-a-content-machine-that-never-sleeps-0ab7759b781a','You paste a URL → go to sleep → wake up with:','2025-08-17 06:46:39','I Used Firecrawl + GPT + n8n to Build a Content Machine That Never Sleeps','https://miro.medium.com/v2/resize:fit:1155/0*uSQON1eZqQrLekWI.png',NULL,NULL);
INSERT INTO tech_analysis_reports VALUES(13,'https://medium.com/@joe.njenga/5-best-web-crawling-mcp-servers-to-scrape-like-a-pro-stop-using-scripts-0dedc97b2558','If you are not using MCP to scrape, you are wasting hours on tasks that should take minutes.','2025-08-17 06:47:02','5 Best Web Crawling MCP Servers to Scrape Like a Pro (Stop Using Scripts)','https://miro.medium.com/v2/resize:fit:1200/1*a51AHoiQ8EFO86QSdpX-cw.png',NULL,NULL);
INSERT INTO tech_analysis_reports VALUES(34,'https://www.uploadvr.com/meta-squeezeme-mobile-ready-distillation-of-gaussian-full-body-avatars/','Meta distilled its full-body Codec Avatars tech to render 3 at once on Quest 3 standalone, with some notable tradeoffs.','2025-08-17 08:58:55','Meta Got 3 Full-Body Codec Avatars Running On Quest 3','https://www.uploadvr.com/content/images/size/w1200/2025/08/Meta-SqueezeMe-distilled-full-body-Codec-Avatars.png',NULL,'아바타');
INSERT INTO tech_analysis_reports VALUES(36,'https://github.com/resemble-ai/chatterbox','SoTA open-source TTS. Contribute to resemble-ai/chatterbox development by creating an account on GitHub.','2025-08-17 09:00:22','GitHub - resemble-ai/chatterbox: SoTA open-source TTS','https://opengraph.githubassets.com/7e09f226fd00e760fbaa75c1607d11cab880a0b397c24b037adf4c5b9786c9f6/resemble-ai/chatterbox',NULL,'지능형 아바타');
INSERT INTO tech_analysis_reports VALUES(38,'https://www.nianticspatial.com/blog/niantic-spatial-sdk-meta-quest-3-passthrough-camera-api','Niantic Spatial SDK v3.15 now supports Meta Quest 3 with immersive mixed reality features powered by Meta’s Passthrough Camera API—including VPS, meshing, semantics, and object detection.','2025-08-17 09:06:43','Niantic Spatial SDK Brings Immersive Reality to Meta Quest 3 with the Passthrough Camera API | Niantic Spatial, Inc.','https://lh3.googleusercontent.com/nrJey5tiuvs4IcDmAedVYiE3mnZI51WxPvZPvaA5Ws6sUOojxZd-uFdU9X_FBYExIiQxCYjDOmX4oSpm9yfpJGtUJP7I2jRcZQ',NULL,'콘텐츠 및 상호작용');
INSERT INTO tech_analysis_reports VALUES(39,'https://developer.nvidia.com/blog/improving-synthetic-data-augmentation-and-human-action-recognition-with-synthda/?mkt_tok=MTU2LU9GTi03NDIAAAGb3yxn-naphb0bpM22R3dFqAFmbn229mjeqJ0d9TrCzfTWeZAO3Mc8U4ggBeVz-VJdGrjBtwZsssDOBoJ8MESm_pdwh5FzK3um5dgAsOXWHY8pAo7vO8i4','Human action recognition is a capability in AI systems designed for safety-critical applications, such as surveillance, eldercare, and industrial monitoring. However, many real-world datasets are…','2025-08-17 09:07:10','Improving Synthetic Data Augmentation and Human Action Recognition with SynthDa | NVIDIA Technical Blog','https://developer-blogs.nvidia.com/wp-content/uploads/2025/07/overlay-synthda-500x282.gif',NULL,'AIGC');
INSERT INTO tech_analysis_reports VALUES(40,'https://docs.google.com/document/d/19R-0DCJkpisiqPzSt-Zlexy4lX2RxbubdIbAp6YZdao/edit?usp=sharing','오아시스 컨소시엄의 메타버스 관련 표준화 동향 보고서 1. 개요: 메타버스 시대의 윤리적 기반 구축을 위한 표준화 동향 오아시스 컨소시엄(Oasis Consortium)은 메타버스 시대의 도래에 따라 새롭게 부상하는 표준화 논의에서 중요한 역할을 수행하고 있는 비영리 싱크탱크입니다. 이 컨소시엄은 기술적 상호운용성 표준을 넘어서, 사용자 안전과 윤리적 거버넌스라는 본질적인 문제에 초점을 맞춰 디지털 지속가능성을 향한 길을 모색하고 있습니다. 2020년 창립된 이 단체의 핵심적인 이니셔티브는 ’사용자 안전 표준(User…','2025-08-17 09:39:18','Oasis 메타버스 표준화 동향','https://lh7-us.googleusercontent.com/docs/AHkbwyKp6xV7KtfQwNU-pZgaO5DQtQcEJWl6Lf-f56rursAq1mMd58mIzaWndKGWXGDQ_Uu-z0VUAUhDyOOxlxK9M2sgwUZPkxxm-erIivSBjdoNBWQMvQ6r=w1200-h630-p',NULL,'보안 및 프라이버시');
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  , description TEXT);
INSERT INTO categories VALUES(3,'디지털 자산 및 경제',NULL);
INSERT INTO categories VALUES(8,'상호운용성',replace('	•	크로스 플랫폼 접속 프로토콜\n	•	가상 공간 간 이동(teleportation) 규격\n	•	자산·아이템 이동성\n	•	공통 API 및 SDK 표준화','\n',char(10)));
INSERT INTO categories VALUES(9,'보안 및 프라이버시',replace('	•	데이터 암호화 및 무결성 검증\n	•	안전한 자격 증명 공유\n	•	접근 제어 및 권한 관리\n	•	프라이버시 보존 연산 (예: 동형암호, MPC)','\n',char(10)));
INSERT INTO categories VALUES(10,'기타','기타 분류가 애매한 모든 것들.');
INSERT INTO categories VALUES(11,'콘텐츠 및 상호작용',replace('	•	3D 모델링 포맷 (glTF, USD 등)\n	•	VR/AR 상호작용 인터페이스\n	•	공간 오디오 및 몰입형 미디어 규격\n	•	햅틱 피드백 및 디바이스 상호운용성','\n',char(10)));
INSERT INTO categories VALUES(12,'아바타','	•	아바타 상호운용성 (의상, 액세서리, 표현 방식)');
INSERT INTO categories VALUES(13,'신원',replace('	•	DID(Decentralized Identifier) 및 VC(Verifiable Credential)\n	•	생체인식 기반 인증\n	•	개인정보 보호 및 익명성 보장 규격','\n',char(10)));
INSERT INTO categories VALUES(14,'인프라 및 네트워크',replace('	•	초저지연 네트워크 (5G, 6G, Wi-Fi 7)\n	•	엣지 컴퓨팅 및 클라우드 인프라\n	•	데이터 전송 및 동기화 프로토콜\n	•	실시간 스트리밍 및 분산 처리 표준','\n',char(10)));
INSERT INTO categories VALUES(15,'지능형 아바타',replace('	•	AI 기반 아바타 자동 생성(외형·목소리·행동 패턴)\n	•	NPC(Non-Player Character) 및 에이전트의 상호작용 프로토콜\n	•	감정·표정·제스처 합성의 표준 데이터 모델','\n',char(10)));
INSERT INTO categories VALUES(16,'AIGC',replace('•	가상 공간·오브젝트 자동 생성(AIGC) 포맷\n	•	디지털 트윈+AI 시뮬레이션(도시, 교통, 기후 등) 연계 규격\n	•	실시간 사용자 맞춤형 환경 렌더링(예: 난이도 조정, 동적 레이아웃)','\n',char(10)));
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('reports',9);
INSERT INTO sqlite_sequence VALUES('conferences',16);
INSERT INTO sqlite_sequence VALUES('organizations',14);
INSERT INTO sqlite_sequence VALUES('tech_analysis_reports',40);
INSERT INTO sqlite_sequence VALUES('categories',16);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_organization ON reports(organization);
CREATE INDEX idx_conferences_start_date ON conferences(start_date);
CREATE INDEX idx_conferences_end_date ON conferences(end_date);
CREATE INDEX idx_conferences_organization ON conferences(organization);
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_categories_name ON categories(name);
COMMIT;
