import { CodexEntry } from "../types";

export const INITIAL_CODEX_DATA: CodexEntry[] = [
    // Personen
    {
        id: 'npc_graves',
        title: 'Ausbilder Graves',
        category: 'Personen',
        content: "Ein hartgesottener Veteran mit einer vernarbten Miene und einer Stimme wie Schotter. Er ist der leitende taktische Ausbilder an der Akademie und scheint ein besonderes, wenn auch strenges, Interesse an Kaelens Entwicklung zu haben.",
        keywords: ['Graves', 'Ausbilder Graves'],
        unlocked: false,
        voice: 'Orus',
    },
    {
        id: 'npc_anya',
        title: 'Kadettin Anya',
        category: 'Personen',
        content: "Eine intelligente und ehrgeizige Kadettin, die oft in der Bibliothek oder auf dem Trainingsgelände zu finden ist. Sie wirkt freundlich, aber es liegt eine Aura des Ehrgeizes und des Geheimnisses um sie.",
        keywords: ['Anya', 'Kadettin Anya'],
        unlocked: false,
        voice: 'Kore',
    },
    {
        id: 'npc_elara',
        title: 'Archivarin Elara',
        category: 'Personen',
        content: "Die stille und gelehrte Wächterin der Akademiearchive. Elara spricht in einem ruhigen, gelassenen Ton und scheint mehr über die Geheimnisse der Akademie zu wissen, als sie preisgibt.",
        keywords: ['Elara', 'Archivarin Elara', 'Archivarin'],
        unlocked: false,
        voice: 'Umbriel',
    },
    {
        id: 'npc_viktor',
        title: 'Viktor, der Versorger',
        category: 'Personen',
        content: "Ein uralter Vampir aus der 'Alten Welt', der einen versteckten Laden in den unteren Ebenen der Akademie betreibt. Er spricht mit einem schweren, aber subtilen osteuropäischen Akzent und hat immer seltene und manchmal verbotene Waren im Angebot - zu einem Preis.",
        keywords: ['Viktor', 'Versorger', 'Händler'],
        unlocked: false,
        voice: 'Algenib',
    },
    // Orte
    {
        id: 'loc_barracks',
        title: 'Die Kaserne',
        category: 'Orte',
        content: "Der Wohnbereich der Kadetten. Sterile, funktionale Räume, die wenig Privatsphäre bieten. Hier beginnen und enden die meisten Tage der Rekruten.",
        keywords: ['Kaserne', 'dein Zimmer', 'deinem Zimmer'],
        unlocked: false,
    },
    {
        id: 'loc_training_grounds',
        title: 'Trainingsgelände',
        category: 'Orte',
        content: "Ein weitläufiger Komplex mit Hindernisparcours, Schießständen und holographischen Kampfsimulatoren. Der Geruch von Ozon und Schweiß liegt ständig in der Luft.",
        keywords: ['Trainingsgelände', 'Trainingshalle', 'Kampfsimulator'],
        unlocked: false,
    },
     // Fraktionen
    {
        id: 'fac_valerius',
        title: 'Haus Valerius',
        category: 'Fraktionen',
        content: "Eine der ältesten und einflussreichsten Vampirfamilien. Sie sind bekannt für ihre politische Raffinesse, ihre Arroganz und ihre Beherrschung der Sanguine-Magie. Sie legen Wert auf Tradition und reines Blut.",
        keywords: ['Valerius'],
        unlocked: false,
    },
    // Lore
    {
        id: 'lore_system',
        title: 'Das System',
        category: 'Lore',
        content: "Eine mysteriöse Schnittstelle, die sich als leuchtendes Tattoo auf Kaelens Arm manifestiert. Es vergibt Quests, verfolgt den Fortschritt und scheint eine direkte Verbindung zu seinen vampirischen Fähigkeiten zu haben. Seine Herkunft und sein wahrer Zweck sind unbekannt.",
        keywords: ['System', 'Tattoo', 'deinem Arm'],
        unlocked: true, // Unlocked from the start
    },
];