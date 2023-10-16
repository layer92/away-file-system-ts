import { Box } from "away-core/Box";
import { Expect } from "away-core/Expect";
import { OnException } from "away-core/OnException";
import { FileFormatBox } from "./FileFormatBox";

/** values such as: ".mp3", ".jpg", ".tar.gz" etc... */
export class FileExtensionBox extends Box<string>{
    constructor(
        data:string,
        onValidationFail:OnException,
    ){
        Expect(data.startsWith("."),`data: started with "."`,onValidationFail);
        super(data);
    }

    static MakeFromFormat(format:FileFormatBox){
        return new FileExtensionBox("."+format.getData(),()=>{});
    }

    toFormatBox(){
        return new FileFormatBox( this._data.slice(1) );
    }

    // TODO: move this logic somewhere else, perhaps into a separate library, as it's way to prone to changing
    isProbablyAudioFile(){
        return [
            ".wav",
            ".mp3",
            ".flac",
            ".ogg",
            ".aiff",
            ".aif",
            ".alac",
            ".mpc",
        ].includes(this._data);
    }

    isProbablyImageFile(){
        return [
            ".jpg",
            ".jpeg",
            ".bmp",
            ".png",
            ".gif",
        ].includes(this._data);
    }

    isProbablyVideoFile(){
        return [
            ".mp4",
            ".ogv",
            ".mkv",
        ].includes(this._data);
    }

    canProbablyUseUtf8Encoding(){
        return [
            ".txt",
            ".htm",
            ".html",
            ".json",
            ".xml",
            ".csv",
            ".tsv",
            ".svg",
        ].includes(this._data);
    }

    getProbablyCannotUseUtf8Encoding(){
        return (
            // always return false if a whitelisted utf8able format (eg svg is an image, but it's also utf8 compatible)
            !this.canProbablyUseUtf8Encoding()
            && (
                this.isProbablyAudioFile()
                || this.isProbablyImageFile()
                || this.isProbablyVideoFile()
                || [
                    ".xcf",
                    ".psd",
                    ".pdf",
                ].includes(this._data)
            )
        );
    }
}