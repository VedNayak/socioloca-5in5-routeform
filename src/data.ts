export const services = [
  {
    id: "ocean",
    number: "01",
    name: "Ocean freight",
    short: "Built for the bigger picture.",
    description:
      "Space for what moves your business. Full containers, consolidated cargo and specialist sea freight, with clearing and forwarding coordinated around your shipment.",
    image: "port",
    source: "sea-freight",
    tags: ["FCL & LCL", "RoRo & break bulk", "Import & export"],
    covers: [
      "Full and less-than-container loads",
      "Consolidation and deconsolidation",
      "Packing, lashing and crating",
      "Clearing, forwarding and delivery",
    ],
    scenario:
      "A distributor consolidating packaged goods for an international replenishment shipment.",
    stages: [
      "Confirm cargo and container needs",
      "Coordinate booking and export documents",
      "Arrange clearance and onward delivery",
    ],
    consideration:
      "Plan around vessel schedules, port cut-offs and destination handling. Transit times and rates depend on the actual lane.",
  },
  {
    id: "air",
    number: "02",
    name: "Air freight",
    short: "When the next move matters.",
    description:
      "A considered approach to time-sensitive cargo. Import and export consolidation, project cargo and perishable handling, connected with ground services.",
    image: "air",
    source: "air-freight",
    tags: ["Import & export", "Perishable cargo", "Door to door"],
    covers: [
      "Air import and export consolidation",
      "Project cargo handling",
      "Perishable cargo handling",
      "Customs clearance and delivery",
    ],
    scenario:
      "An electronics importer arranging a time-sensitive shipment of boxed devices.",
    stages: [
      "Check dimensions and handling needs",
      "Coordinate space and export clearance",
      "Arrange arrival handling and delivery",
    ],
    consideration:
      "Chargeable weight, aircraft capacity and handling restrictions shape the available options. A required arrival date is a planning input, not a guarantee.",
  },
  {
    id: "land",
    number: "03",
    name: "Land transport",
    short: "Connecting the final kilometres.",
    description:
      "From port collection to regional distribution. Container transport, groupage and heavy equipment movements, with border clearance where needed.",
    image: "road",
    source: "land-transport",
    tags: ["Regional distribution", "LTL & FTL", "Heavy equipment"],
    covers: [
      "Container transportation",
      "Regional LTL / FTL trucking",
      "Break bulk and heavy equipment movements",
      "Port operations and border clearance",
    ],
    scenario:
      "A distributor planning a cross-border delivery of palletised stock to a regional customer.",
    stages: [
      "Confirm route and vehicle requirements",
      "Prepare border and cargo paperwork",
      "Coordinate collection and delivery",
    ],
    consideration:
      "Regional movements depend on border requirements, vehicle access and cargo suitability. Specific destinations and schedules must be confirmed.",
  },
  {
    id: "warehousing",
    number: "04",
    name: "Warehousing",
    short: "More than a place to pause.",
    description:
      "Receiving, storage and distribution as part of one cargo journey. Bonded warehousing, inventory support and packing services help prepare the next movement.",
    image: "warehouse",
    source: "warehousing",
    tags: ["Bonded storage", "Packing & labelling", "Distribution"],
    covers: [
      "Airport and seaport transit warehousing",
      "Bonded storage and inventory management",
      "Packaging and labelling",
      "LCL consolidation and deconsolidation",
    ],
    scenario:
      "A trading business receiving cargo into storage before staged onward distribution.",
    stages: [
      "Agree storage and receiving requirements",
      "Record receipt and prepare goods",
      "Coordinate release and distribution",
    ],
    consideration:
      "Storage conditions, capacity and release arrangements need confirmation for each commodity. The model and service scenario are illustrative.",
  },
  {
    id: "customs",
    number: "05",
    name: "Customs & cargo support",
    short: "Every detail moves the whole.",
    description:
      "Clearance begins with a clear cargo record. Plan the invoices, classification questions, approvals and release documents alongside the movement.",
    image: "electronics",
    source: "customs-clearance",
    tags: ["Documentation", "Clearance planning", "Packing support"],
    covers: [
      "Classification and duty / tax assessment",
      "Permanent and temporary import procedures",
      "Transit, re-export and exhibition cargo",
      "Document approvals, attestation and packing",
    ],
    scenario:
      "A business preparing temporary import paperwork for an exhibition shipment.",
    stages: [
      "Review cargo information and documents",
      "Confirm required procedures and approvals",
      "Coordinate clearance and release",
    ],
    consideration:
      "Requirements vary by shipment and jurisdiction. Consult an appointed operations team for current guidance; this concept provides no legal or regulatory advice.",
  },
] as const;
export const industries = [
  {
    id: "electronics",
    name: "Electronics & devices",
    label: "PRECISION AT EVERY HANDOVER",
    image: "electronics",
    text: "Delicate products. Detailed records. A shipment approach that considers protection, traceability and the paperwork behind every handover.",
    challenge: "Fragile packaging, item identification and shipment deadlines.",
    approach:
      "Combine protective packing, item-level records and a suitable freight mode. High-value cargo needs a clear chain of custody.",
    example:
      "Boxed mobile devices received for inspection, consolidated and prepared for air export.",
    source: "other-services",
  },
  {
    id: "food",
    name: "Food & perishables",
    label: "PLAN AROUND THE PRODUCT",
    image: "food",
    text: "The product sets the pace. Perishable cargo needs a plan for handling, clearance and the time between each stage.",
    challenge:
      "Shelf life, product-specific conditions and authority approvals.",
    approach:
      "Discuss perishable air cargo handling and foodstuff clearance with the team. Confirm the required conditions before booking.",
    example:
      "A food importer preparing a perishable air shipment with handling and arrival clearance requirements.",
    source: "air-freight",
  },
  {
    id: "industrial",
    name: "Industrial & project cargo",
    label: "THINK BEYOND STANDARD DIMENSIONS",
    image: "industrial",
    text: "Not every shipment fits a standard box. Equipment movements call for deliberate planning of dimensions, access and handling.",
    challenge: "Oversized loads, lifting needs and site access.",
    approach:
      "Consider sea break bulk or RoRo alongside specialist land movements. Confirm equipment suitability and local handling arrangements.",
    example:
      "A construction supplier planning sea freight and onward land transport for heavy equipment.",
    source: "land-transport",
  },
  {
    id: "trade",
    name: "Trade & distribution",
    label: "FROM ARRIVAL TO THE NEXT ORDER",
    image: "warehouse",
    text: "Inventory has a journey of its own. Receiving, consolidation, storage and release connect inbound cargo with onward distribution.",
    challenge:
      "Multiple consignments, storage requirements and staggered release.",
    approach:
      "Connect FCL or LCL freight with warehousing, packing, labelling and distribution services.",
    example:
      "General merchandise received into bonded storage and released in planned batches.",
    source: "warehousing",
  },
] as const;
export const journey = [
  {
    name: "Understand",
    title: "Start with the cargo.",
    text: "Origin, destination, dimensions and required dates establish the brief. Special handling needs belong in the conversation from the beginning.",
    detail: "OUTPUT / A clear shipment brief",
  },
  {
    name: "Plan",
    title: "Choose the right movement.",
    text: "Compare transport modes, handling requirements and documentation. Confirm the routing, scope and commercial terms with an appointed operations team.",
    detail: "OUTPUT / Agreed routing and scope",
  },
  {
    name: "Prepare",
    title: "Get the details ready.",
    text: "Coordinate packing, shipment documents and any required approvals before cargo moves. Readiness matters at every handover.",
    detail: "OUTPUT / Cargo and documents ready",
  },
  {
    name: "Move",
    title: "Connect each handover.",
    text: "Collection, carriage and clearance form one sequence. Confirm milestones and exception contacts with the appointed operations team.",
    detail: "OUTPUT / Coordinated transport stages",
  },
  {
    name: "Deliver",
    title: "Finish at the destination.",
    text: "Coordinate arrival clearance, delivery or storage according to the agreed brief. Confirm receipt and any onward requirements.",
    detail: "OUTPUT / Agreed destination handover",
  },
];
