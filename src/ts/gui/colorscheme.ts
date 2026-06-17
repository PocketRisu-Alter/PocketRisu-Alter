import { get, writable } from "svelte/store";
import { getDatabase, setDatabase } from "../storage/database.svelte";
import { downloadFile } from "../globalApi.svelte";
import { BufferToText, selectSingleFile } from "../util";
import { notifyError } from "../alert";
import { isLite } from "../lite";
import { CustomCSSStore, SafeModeStore } from "../stores.svelte";

export interface ColorScheme{
    bgcolor: string;
    darkbg: string;
    borderc: string;
    selected: string;
    draculared: string;
    textcolor: string;
    textcolor2: string;
    darkBorderc: string;
    darkbutton: string;
    primary: string;
    type:'light'|'dark';
}

// Built-in palette pack (AlterRisu). Keys follow the kebab-case convention;
// display names live in colorSchemeLabels.
const alterRisuSchemes = {
    "alter-dark": {
        bgcolor: "#1a1612",
        darkbg: "#221d18",
        borderc: "rgba(240, 230, 212, 0.18)",
        selected: "#342c24",
        draculared: "#e07a5c",
        textcolor: "#f0e6d6",
        textcolor2: "#c4b9a5",
        darkBorderc: "rgba(240, 230, 212, 0.08)",
        darkbutton: "#2a241e",
        primary: "#e6a55c",
        type:'dark' as const
    },
    "alter-light": {
        bgcolor: "#faf6ee",
        darkbg: "#f4eee0",
        borderc: "rgba(42, 36, 30, 0.22)",
        selected: "#ddd0b7",
        draculared: "#b25240",
        textcolor: "#2a241e",
        textcolor2: "#5a4e3c",
        darkBorderc: "rgba(42, 36, 30, 0.1)",
        darkbutton: "#ebe2cf",
        primary: "#b87833",
        type:'light' as const
    },
    "purple-dark": {
        bgcolor: "#14111d",
        darkbg: "#1b1726",
        borderc: "rgba(238, 233, 247, 0.18)",
        selected: "#302943",
        draculared: "#e06c5f",
        textcolor: "#eee9f7",
        textcolor2: "#c3bad3",
        darkBorderc: "rgba(238, 233, 247, 0.08)",
        darkbutton: "#241f33",
        primary: "#a78bfa",
        type:'dark' as const
    },
    "purple-light": {
        bgcolor: "#f4f0fb",
        darkbg: "#ece6f6",
        borderc: "rgba(40, 35, 49, 0.22)",
        selected: "#d7cae8",
        draculared: "#b8443a",
        textcolor: "#282331",
        textcolor2: "#5d536b",
        darkBorderc: "rgba(40, 35, 49, 0.1)",
        darkbutton: "#e2d9ef",
        primary: "#7c3aed",
        type:'light' as const
    },
    "tokyo-night": {
        bgcolor: "#1a1b26",
        darkbg: "#1f2335",
        borderc: "rgba(192, 202, 245, 0.2)",
        selected: "#2f334d",
        draculared: "#f7768e",
        textcolor: "#c0caf5",
        textcolor2: "#a9b1d6",
        darkBorderc: "rgba(192, 202, 245, 0.09)",
        darkbutton: "#24283b",
        primary: "#7aa2f7",
        type:'dark' as const
    },
    "obsidian": {
        bgcolor: "#1e1e1e",
        darkbg: "#262626",
        borderc: "rgba(220, 221, 222, 0.2)",
        selected: "#363636",
        draculared: "#e16363",
        textcolor: "#dcddde",
        textcolor2: "#b3b3b3",
        darkBorderc: "rgba(220, 221, 222, 0.08)",
        darkbutton: "#2a2a2a",
        primary: "#8a5cf6",
        type:'dark' as const
    },
    "nord-dark": {
        bgcolor: "#2e3440",
        darkbg: "#3b4252",
        borderc: "rgba(236, 239, 244, 0.2)",
        selected: "#4c566a",
        draculared: "#bf616a",
        textcolor: "#eceff4",
        textcolor2: "#d8dee9",
        darkBorderc: "rgba(236, 239, 244, 0.08)",
        darkbutton: "#434c5e",
        primary: "#88c0d0",
        type:'dark' as const
    },
    "nord-light": {
        bgcolor: "#eceff4",
        darkbg: "#e5e9f0",
        borderc: "rgba(46, 52, 64, 0.22)",
        selected: "#c8d1e0",
        draculared: "#bf616a",
        textcolor: "#2e3440",
        textcolor2: "#3b4252",
        darkBorderc: "rgba(46, 52, 64, 0.1)",
        darkbutton: "#d8dee9",
        primary: "#5e81ac",
        type:'light' as const
    },
    "rose-pine": {
        bgcolor: "#191724",
        darkbg: "#1f1d2e",
        borderc: "rgba(224, 222, 244, 0.2)",
        selected: "#2a2839",
        draculared: "#eb6f92",
        textcolor: "#e0def4",
        textcolor2: "#c4c1e0",
        darkBorderc: "rgba(224, 222, 244, 0.08)",
        darkbutton: "#26233a",
        primary: "#ebbcba",
        type:'dark' as const
    },
    "rose-pine-dawn": {
        bgcolor: "#faf4ed",
        darkbg: "#fffaf3",
        borderc: "rgba(87, 82, 121, 0.22)",
        selected: "#dfdad9",
        draculared: "#b4637a",
        textcolor: "#575279",
        textcolor2: "#797593",
        darkBorderc: "rgba(87, 82, 121, 0.1)",
        darkbutton: "#f2e9e1",
        primary: "#d7827e",
        type:'light' as const
    },
} as const

export const defaultColorScheme: ColorScheme = { ...alterRisuSchemes["alter-dark"] }

const colorShemes = {
    ...alterRisuSchemes,
} as const

export const ColorSchemeTypeStore = writable('dark' as 'dark'|'light')

export const colorSchemeList = Object.keys(colorShemes) as (keyof typeof colorShemes)[]

// Pretty display labels for the scheme keys (keys are kebab-case for data/code
// compatibility). Any key without an entry falls back to the raw key.
export const colorSchemeLabels: Record<string, string> = {
    "alter-dark": "AlterRisu Dark",
    "alter-light": "AlterRisu Light",
    "purple-dark": "Purple Dark",
    "purple-light": "Purple Light",
    "tokyo-night": "Tokyo Night",
    "obsidian": "Obsidian",
    "nord-dark": "Nord Dark",
    "nord-light": "Nord Light",
    "rose-pine": "Rose Pine",
    "rose-pine-dawn": "Rose Pine Dawn",
}

function mapToAlterRisuTheme(name: string): string {
    return colorSchemeList.includes(name as keyof typeof colorShemes) ? name : 'alter-dark';
}

/**
 * Apply the chat bubble customization (mode + colors) to the document root.
 * - Mode is exposed via `data-chat-bubble-mode` on <html>; CSS selectors in
 *   styles.css read it to render bubble/glass treatments per role.
 * - Each color overrides a CSS variable; empty strings clear the override so
 *   the theme's default `--msg-*` token (from tokens.css) takes over again.
 */
export function updateChatBubble(){
    try {
        const db = getDatabase()
        const root = document.documentElement
        const cb = db.chatBubble
        if(!cb){
            root.removeAttribute('data-chat-bubble-mode')
            return
        }
        if(cb.mode && cb.mode !== 'none'){
            root.setAttribute('data-chat-bubble-mode', cb.mode)
        } else {
            root.removeAttribute('data-chat-bubble-mode')
        }
        const set = (name: string, v: string) => {
            if(v && v.trim()){
                root.style.setProperty(name, v)
            } else {
                root.style.removeProperty(name)
            }
        }
        set('--chat-user-bg',        cb.userBg)
        set('--chat-user-border',    cb.userBorder)
        set('--chat-char-bg',        cb.charBg)
        set('--chat-char-border',    cb.charBorder)
        set('--chat-em-color',       cb.emColor)
        set('--chat-streaming-color', cb.streamingColor)
    } catch (error) {}
}

export function changeColorScheme(colorScheme: string){
    try {
        let db = getDatabase()
        if(colorScheme !== 'custom'){
            const key = colorScheme in colorShemes ? colorScheme : 'alter-dark'
            db.colorScheme = safeStructuredClone(colorShemes[key])
            db.colorSchemeName = key
        } else {
            db.colorSchemeName = 'custom'
        }
        updateColorScheme()   
    } catch (error) {}
}

export function updateColorScheme(){
    try {
        let db = getDatabase()

        let colorScheme = db.colorScheme
        let colorSchemeName = db.colorSchemeName ?? 'alter-dark'

        if(colorScheme == null){
            colorScheme = safeStructuredClone(defaultColorScheme)
        }

        if(get(isLite)){
            colorScheme = safeStructuredClone(alterRisuSchemes["alter-dark"])
            colorSchemeName = 'alter-dark'
        }

        if(colorSchemeName !== 'custom' && !(colorSchemeName in colorShemes)){
            colorSchemeName = 'alter-dark'
            colorScheme = safeStructuredClone(alterRisuSchemes["alter-dark"])
            db.colorSchemeName = colorSchemeName
        }

        //set css variables
        const alterTheme = mapToAlterRisuTheme(colorSchemeName);
        document.documentElement.dataset.theme = alterTheme;
        document.documentElement.style.setProperty("--risu-theme-bgcolor", colorScheme.bgcolor);
        document.documentElement.style.setProperty("--risu-theme-darkbg", colorScheme.darkbg);
        document.documentElement.style.setProperty("--risu-theme-borderc", colorScheme.borderc);
        document.documentElement.style.setProperty("--risu-theme-selected", colorScheme.selected);
        document.documentElement.style.setProperty("--risu-theme-draculared", colorScheme.draculared);
        document.documentElement.style.setProperty("--risu-theme-textcolor", colorScheme.textcolor);
        document.documentElement.style.setProperty("--risu-theme-textcolor2", colorScheme.textcolor2);
        document.documentElement.style.setProperty("--risu-theme-darkborderc", colorScheme.darkBorderc);
        document.documentElement.style.setProperty("--risu-theme-darkbutton", colorScheme.darkbutton);
        // Legacy data may lack `primary` (added later); fall back to default so
        // the toggle/CTA fill stays usable until the user picks a custom value.
        document.documentElement.style.setProperty("--risu-theme-primary", colorScheme.primary ?? defaultColorScheme.primary);
        ColorSchemeTypeStore.set(colorScheme.type)
        updateChatBubble()
    } catch (error) {}
}

export function changeColorSchemeType(type: 'light'|'dark'){
    try {
        let db = getDatabase()
        db.colorScheme.type = type
        updateColorScheme()
        updateTextThemeAndCSS()
    } catch (error) {}
}

export function exportColorScheme(){
    let db = getDatabase()
    let json = JSON.stringify(db.colorScheme)
    downloadFile('colorScheme.json', json)
}

export async function importColorScheme(){
    const uarray = await selectSingleFile(['json'])
    if(uarray == null){
        return
    }
    const string = BufferToText(uarray.data)
    let colorScheme: ColorScheme
    try{
        colorScheme = JSON.parse(string)
        if(
            typeof colorScheme.bgcolor !== 'string' ||
            typeof colorScheme.darkbg !== 'string' ||
            typeof colorScheme.borderc !== 'string' ||
            typeof colorScheme.selected !== 'string' ||
            typeof colorScheme.draculared !== 'string' ||
            typeof colorScheme.textcolor !== 'string' ||
            typeof colorScheme.textcolor2 !== 'string' ||
            typeof colorScheme.darkBorderc !== 'string' ||
            typeof colorScheme.darkbutton !== 'string' ||
            typeof colorScheme.type !== 'string'
        ){
            notifyError('Invalid color scheme')
            return
        }
        // `primary` is optional in old export files (pre-primary-token migration).
        // Backfill from the default so a re-export round-trips with the field set.
        if(typeof colorScheme.primary !== 'string'){
            colorScheme.primary = defaultColorScheme.primary
        }
        changeColorScheme('custom')
        let db = getDatabase()
        db.colorScheme = colorScheme
        updateColorScheme()
    }
    catch(e){
        notifyError('Invalid color scheme')
        return
    
    }
}

export function updateTextThemeAndCSS(){
    let db = getDatabase()
    const root = document.querySelector(':root') as HTMLElement;
    if(!root){
        return
    }
    let textTheme = get(isLite) ? 'standard' : db.textTheme
    let colorScheme = get(isLite) ? 'dark' : db.colorScheme.type
    switch(textTheme){
        case "standard":{
            if(colorScheme === 'dark'){
                root.style.setProperty('--FontColorStandard', '#fafafa');
                root.style.setProperty('--FontColorItalic', '#8C8D93');
                root.style.setProperty('--FontColorBold', '#fafafa');
                root.style.setProperty('--FontColorItalicBold', '#8C8D93');
                root.style.setProperty('--FontColorQuote1', '#8BE9FD');
                root.style.setProperty('--FontColorQuote2', '#FFB86C');
            }else{
                root.style.setProperty('--FontColorStandard', '#0f172a');
                root.style.setProperty('--FontColorItalic', '#8C8D93');
                root.style.setProperty('--FontColorBold', '#0f172a');
                root.style.setProperty('--FontColorItalicBold', '#8C8D93');
                root.style.setProperty('--FontColorQuote1', '#8BE9FD');
                root.style.setProperty('--FontColorQuote2', '#FFB86C');
            }
            break
        }
        case "highcontrast":{
            if(colorScheme === 'dark'){
                root.style.setProperty('--FontColorStandard', '#f8f8f2');
                root.style.setProperty('--FontColorItalic', '#F1FA8C');
                root.style.setProperty('--FontColorBold', '#8BE9FD');
                root.style.setProperty('--FontColorItalicBold', '#FFB86C');
                root.style.setProperty('--FontColorQuote1', '#8BE9FD');
                root.style.setProperty('--FontColorQuote2', '#FFB86C');
            }
            else{
                root.style.setProperty('--FontColorStandard', '#0f172a');
                root.style.setProperty('--FontColorItalic', '#F1FA8C');
                root.style.setProperty('--FontColorBold', '#8BE9FD');
                root.style.setProperty('--FontColorItalicBold', '#FFB86C');
                root.style.setProperty('--FontColorQuote1', '#8BE9FD');
                root.style.setProperty('--FontColorQuote2', '#FFB86C');
            }
            break
        }
        case "custom":{
            root.style.setProperty('--FontColorStandard', db.customTextTheme.FontColorStandard);
            root.style.setProperty('--FontColorItalic', db.customTextTheme.FontColorItalic);
            root.style.setProperty('--FontColorBold', db.customTextTheme.FontColorBold);
            root.style.setProperty('--FontColorItalicBold', db.customTextTheme.FontColorItalicBold);
            root.style.setProperty('--FontColorQuote1', db.customTextTheme.FontColorQuote1 ?? '#8BE9FD');
            root.style.setProperty('--FontColorQuote2', db.customTextTheme.FontColorQuote2 ?? '#FFB86C');
            break
        }
    }

    switch(db.font){
        case "default":{
            root.style.setProperty('--risu-font-family', 'Arial, sans-serif');
            break
        }
        case "timesnewroman":{
            root.style.setProperty('--risu-font-family', 'Times New Roman, serif');
            break
        }
        case "custom":{
            root.style.setProperty('--risu-font-family', db.customFont);
            break
        }
    }

    if(!get(SafeModeStore)){
        CustomCSSStore.set(db.customCSS ?? '')
    }
    else{
        CustomCSSStore.set('')
    }
}
