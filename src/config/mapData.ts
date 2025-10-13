import { MapLocation } from "../types";

export const INITIAL_MAP_DATA: MapLocation[] = [
    {
        id: 'loc_barracks',
        name: 'Kaserne',
        description: 'Dein Startpunkt. Der Wohnbereich der Kadetten.',
        coordinates: { x: 50, y: 80 },
        keywords: ['Kaserne', 'dein Zimmer', 'deinem Zimmer'],
        discovered: true, // Start location
    },
    {
        id: 'loc_training_grounds',
        name: 'Trainingsgelände',
        description: 'Hier werden die Kadetten bis an ihre Grenzen getrieben.',
        coordinates: { x: 25, y: 60 },
        keywords: ['Trainingsgelände', 'Trainingshalle', 'Kampfsimulator'],
        discovered: false,
    },
    {
        id: 'loc_mess_hall',
        name: 'Mensa',
        description: 'Der soziale Treffpunkt der Akademie.',
        coordinates: { x: 50, y: 55 },
        keywords: ['Mensa', 'Speisesaal'],
        discovered: false,
    },
    {
        id: 'loc_library',
        name: 'Bibliothek/Archiv',
        description: 'Ein Hort des Wissens, sowohl öffentlich als auch geheim.',
        coordinates: { x: 75, y: 60 },
        keywords: ['Bibliothek', 'Archiv'],
        discovered: false,
    },
    {
        id: 'loc_command_wing',
        name: 'Kommandotrakt',
        description: 'Die Büros der Akademieleitung. Zutritt strengstens verboten.',
        coordinates: { x: 50, y: 20 },
        keywords: ['Kommandotrakt', 'Büro des Kommandanten'],
        discovered: false,
    }
];
