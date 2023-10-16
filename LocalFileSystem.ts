import { appendFileSync, copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, renameSync, rmdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { FileNameBox } from "./FileNameBox";
import { FilePathBox } from "./FilePathBox";
import { FolderNameBox } from "./FolderNameBox";
import { Expect } from "away-away/Expect";
import { BytesBox } from "./BytesBox";
import { OnException } from "away-away/OnException";
import { FileSystemPathSanityExpecter } from "./FileSystemPathSanityExpecter";
import { FileSystemPathBox } from "./FileSystemPathBox";
import { FolderPathBox } from "./FolderPathBox";

type FileReadOptions = {
    encoding?:BufferEncoding
}
type FileWriteOptions = {
    encoding?:BufferEncoding
}
// TODO: common node fs read exceptions such as file not found
type FileOnExceptionCallbacks = {

};

const DEFAULT_STRING_ENCODING = "utf-8";

export class LocalFileSystem {
    constructor(protected _needs:{
        expectSaneFilePath?:FileSystemPathSanityExpecter
    }){
        
    }

    readStringSync(
        { filePathBox, options }:
        { filePathBox: FilePathBox; options?: FileReadOptions; }&FileOnExceptionCallbacks
    ){
        try{
            const string = readFileSync(
                filePathBox.getData(),
                options?.encoding||DEFAULT_STRING_ENCODING
            );
            return string;
        }catch(e){
            // TODO: figure out what errors are thrown and make callbacks for them
            throw e;
        }
    }
    async readStringAsync({filePathBox,options}:{filePathBox:FilePathBox,options?:FileReadOptions}){
        const string = await readFile(
            filePathBox.getData(),
            options?.encoding||DEFAULT_STRING_ENCODING
        );
        return string;
    }
    getFileSizeBytesSync(pathBox:FilePathBox){
        const bytes = statSync(pathBox.getData()).size;
        return new BytesBox(bytes);
    }
    isEmptyFileSync(pathBox:FilePathBox){
        return this.getFileSizeBytesSync(pathBox).getData()===0;
    }
    writeStringSync(
        data:string,
        pathBox:FilePathBox,
        options?:{
            encoding?:BufferEncoding,
            append?:boolean,
        }
    ){
        const dataString = ''+data;
        this.maybeExpectSanePath(pathBox);
        if( options?.append ){
            appendFileSync(
                ''+pathBox,
                dataString,
                options,
            );
            return;
        }
        writeFileSync(
            ''+pathBox,
            dataString,
            options
        );
    }
    readJsonSync(
        {
            pathBox,
            fileReadOptions,
            onBadData,
        }:{
            pathBox:FilePathBox,
            fileReadOptions?:FileReadOptions,
            onBadData:OnException,
        }
    ){
        const string = this.readStringSync({ filePathBox: pathBox, options: fileReadOptions });
        try{
            return JSON.parse(''+string);
        }catch(e:any){
            onBadData();
            throw new Error(`JSON parse error in file ${pathBox.getData()}: `+e.message);
        }
    }
    writeJsonSync(
        data:any,
        pathBox:FilePathBox,
        options?:FileWriteOptions
    ){
        const string = JSON.stringify(data,null,4);
        this.writeStringSync(string,pathBox);
    }
    /**
     * @throws {AbstractFileSystemBox__FileDoesNotExist} 
     */
    deleteFolderSync({folderPathBox,areYouSure,onFolderDoesNotExist}:{folderPathBox:FolderPathBox,areYouSure:"YES"|undefined,onFolderDoesNotExist:OnException}){
        this.maybeExpectSanePath(folderPathBox);
        Expect(areYouSure==="YES",`areYouSure!=="YES"`,()=>{});
        this.expectFolderExistsSync({folderPathBox,onFolderDoesNotExist});
        rmdirSync(folderPathBox.getData(),{recursive:true});
    }
    /**
     * @throws {AbstractFileSystemBox__FileDoesNotExist} 
     */
    deleteFileSync({filePathBox,areYouSure,onFileDoesNotExist}:{filePathBox:FilePathBox,areYouSure:"YES"|undefined,onFileDoesNotExist:OnException}){
        this.maybeExpectSanePath(filePathBox);
        Expect(areYouSure==="YES",`areYouSure!=="YES"`,()=>{});
        this.expectFileExistsSync(filePathBox,onFileDoesNotExist);
        unlinkSync(filePathBox.getData());
    }
    deleteSync({pathBox: filePathBox,areYouSure,onPathDoesNotExist}:{pathBox:FolderPathBox|FilePathBox,areYouSure:"YES"|undefined,onPathDoesNotExist:OnException}){
        this.maybeExpectSanePath(filePathBox);
        Expect(areYouSure==="YES",`areYouSure!=="YES"`,()=>{});
        this.expectPathExists(filePathBox,onPathDoesNotExist);
        rmSync(filePathBox.getData(),{
            recursive:true,
            // force: true,
        });
    }
    /**
     * @throws {AbstractFileSystemBox__DestinationExists} 
     */
    moveSync(
        {
            fromPathBox,
            toPathBox,
            overwrite,
            onDestinationAlreadyExists,
        }: {
            fromPathBox: FolderPathBox|FilePathBox;
            toPathBox: FolderPathBox|FilePathBox;
            overwrite?: boolean;
            onDestinationAlreadyExists:OnException,
        }
    ){
        this.maybeExpectSanePath(toPathBox);
        if(fromPathBox.getData()===toPathBox.getData()){
            return;
        }
        if( !overwrite && this.pathExistsSync(toPathBox) ){
            onDestinationAlreadyExists?.();
            throw new Error(`Destination exists: `+toPathBox.getData());
        }
        renameSync( fromPathBox.getData(), toPathBox.getData() );
    }
    renameFileSync(
        {
            fromPathBox,
            toFileNameBox,
            overwrite,
            onDestinationAlreadyExists,
        }: {
            fromPathBox: FilePathBox;
            toFileNameBox: FileNameBox;
            overwrite?: boolean;
            onDestinationAlreadyExists:OnException,
        }
    ){
        const toPathBox = fromPathBox.rename(toFileNameBox);
        this.moveSync({ fromPathBox, toPathBox, overwrite, onDestinationAlreadyExists});
    }
    renameFolderSync(
        {
            fromPathBox,
            toFileNameBox,
            overwrite,
            onDestinationAlreadyExists,
        }: {
            fromPathBox: FolderPathBox;
            toFileNameBox: FolderNameBox;
            overwrite?: boolean;
            onDestinationAlreadyExists:OnException,
        }){
        const toPathBox = fromPathBox.rename(toFileNameBox);
        this.moveSync({ fromPathBox, toPathBox, overwrite, onDestinationAlreadyExists });
    }
    moveIntoFolderSync(
        {
            fromPath,
            intoPath,
            overwrite,
            onDestinationAlreadyExists,
        }: {
            fromPath: FilePathBox | FolderPathBox;
            intoPath: FolderPathBox;
            overwrite?: boolean;
            onDestinationAlreadyExists:OnException,
        }
    ) {
        const toPathBox = fromPath.moveIntoFolder(intoPath);
        this.moveSync({fromPathBox: fromPath, toPathBox: toPathBox, overwrite,onDestinationAlreadyExists });
    }
    copyIntoFolderSync(
        {
            fromPathBox,
            intoPathBox,
            overwrite,
            onDestinationAlreadyExists,
        }: {
            fromPathBox: FilePathBox | FolderPathBox;
            intoPathBox: FolderPathBox;
            overwrite?: boolean;
            onDestinationAlreadyExists:OnException,
        }
    ) {
        const toPath = fromPathBox.moveIntoFolder(intoPathBox);
        this.copySync({ fromPathBox: fromPathBox, destinationBox: toPath, overwrite, onDestinationAlreadyExists });
    }
    expectFileExistsSync(
        filePathBox:FilePathBox,
        onFileDoesNotExist:OnException
    ){
        Expect(
            this.isExistingFilePathSync(filePathBox),
            `File does not exist: `+filePathBox.getData(),
            onFileDoesNotExist
        );
    }
    expectFolderExistsSync({
        folderPathBox,
        onFolderDoesNotExist
    }:{
        folderPathBox:FolderPathBox,
        onFolderDoesNotExist:OnException
    }){
        Expect(
            this.isExistingFilePathSync(folderPathBox),
            `Folder does not exist: `+folderPathBox.getData(),
            onFolderDoesNotExist
        );
    }
    expectIsEmptyFolderSync({
        folderPathBox,
        onFolderDoesNotExist,
        onNotEmptyFolder
    }:{
        folderPathBox:FolderPathBox,
        onFolderDoesNotExist:OnException,
        onNotEmptyFolder:OnException,
    }){
        const isEmpty = this.isEmptyFolderSync({ folderPathBox, onFolderDoesNotExist });
        Expect(isEmpty, "Folder was not empty: "+folderPathBox.getData(),onNotEmptyFolder);
    }
    isEmptyFolderSync({
        folderPathBox,
        onFolderDoesNotExist
    }:{
        folderPathBox:FolderPathBox,
        onFolderDoesNotExist:OnException
    }){
        const contents = this.getChildrenSync({folderPathBox,onFolderDoesNotExist});
        return contents.length===0;
    }
    expectPathExists(
        pathBox:FolderPathBox|FilePathBox,
        onPathDoesNotExist:OnException
    ){
        Expect(this.pathExistsSync(pathBox),`Path does not exist: `+pathBox.getData(),onPathDoesNotExist);
    }
    backupSync(filePath:FilePathBox){
        const backupPathBox = this.makeBackupPathFromFilePathSync(filePath);
        this.copySync({
            fromPathBox: filePath,
            destinationBox: backupPathBox,
            onDestinationAlreadyExists:()=>{}
        });
    }
    copySync({
        fromPathBox,
        destinationBox,
        overwrite,
        onDestinationAlreadyExists,
    }: {
        fromPathBox: FolderPathBox|FilePathBox;
        destinationBox: FilePathBox;
        overwrite?: boolean;
        onDestinationAlreadyExists:OnException,
    }){
        if(!overwrite && this.pathExistsSync(destinationBox) ){
            onDestinationAlreadyExists?.();
            throw new Error("Destination already exists: "+destinationBox.getData());
        }
        this.maybeExpectSanePath(destinationBox);
        copyFileSync(fromPathBox.getData(),destinationBox.getData());
    }
    /** Returns a pathBox that makes it clear it's a backup, and is guaranteed not to exist. Will probably have a number after it. */
    makeBackupPathFromFilePathSync(fromPath:FilePathBox){
        let backupPath;
        let number = 1;
        do{
            let numberString = ("00"+number).slice(-3);
            if(number>999){
                numberString=""+number;
            }
            backupPath = fromPath.append(`.${numberString}.backup`,()=>{});
            number += 1;
        }while(
            this.pathExistsSync(backupPath)
        );
        return backupPath;
    }
    /** Returns true iff a file exists at this path. */
    isExistingFilePathSync(pathBox:FolderPathBox|FilePathBox){
        if( !this.pathExistsSync(pathBox) ){
            return false;
        }
        return this.isFileSync(pathBox);
    }
    /** Returns true iff a folder exists at this path. */
    isExistingFolderPathSync(pathBox:FolderPathBox|FilePathBox){
        if( !this.pathExistsSync(pathBox) ){
            return false;
        }
        return this.isFolderSync(pathBox);
    }
    isFileSync(path:FolderPathBox|FilePathBox|string){
        return !this.isFolderSync(path);
    }
    isFolderSync(path:FolderPathBox|FilePathBox|string){
        if(path instanceof FolderPathBox || path instanceof FilePathBox){
            path = path.getData();
        }
        if( path.includes("../") ){
            path = resolve(path);
        }
        const stats = lstatSync(path);
        return stats.isDirectory();
    }
    /** Returns true if a folder or file exists at this path. */
    pathExistsSync(pathBox:FolderPathBox|FilePathBox):boolean{
        // unresolved pathBox with "../" will always return false
        // see others having this issue:
        // - https://stackoverflow.com/questions/55438404/fs-existssync-always-returning-false-when-path-has
        // - https://stackoverflow.com/questions/71604456/why-does-fs-existssync-always-return-false
        if( pathBox.getData().includes("../") ){
            pathBox = this.makeResolvedPathBox(pathBox);
        }
        return existsSync(pathBox.getData());
    }
    
    makeResolvedPathBox<T extends FileSystemPathBox>(fromPathBox:T):T{
        const resolvedPath = resolve(fromPathBox.getData());
        if( fromPathBox instanceof FilePathBox ){
            return new FilePathBox(resolvedPath,()=>{}) as T;
        }else{
            return new FolderPathBox(resolvedPath,()=>{}) as T;
        }
    }

    /**
     * @throws {AbstractFileSystemBox__FolderDoesNotExist}
     */
    deleteChildrenSync({
        folderPathBox,
        areYouSure,
        onFolderDoesNotExist,
    }:{
        folderPathBox:FolderPathBox,
        areYouSure:"YES"|undefined,
        onFolderDoesNotExist:OnException,
    }){
        Expect(areYouSure==="YES",`areYouSure!=="YES`,()=>{});
        this.maybeExpectSanePath(folderPathBox);
        const children = this.getChildrenSync({folderPathBox,onFolderDoesNotExist});
        for(const child of children){
            if( child instanceof FolderPathBox ){
                this.deleteFolderSync({folderPathBox:child,areYouSure,onFolderDoesNotExist:()=>{}});
            }else{
                this.deleteFileSync({filePathBox:child,areYouSure,onFileDoesNotExist:()=>{}});
            }
        }
    }
    deleteEmptyFolderSync({
        folderPathBox,onFolderDoesNotExist,onNotEmptyFolder
    }:{
        folderPathBox:FolderPathBox,
        onFolderDoesNotExist:OnException,
        onNotEmptyFolder:OnException,
    }){
        this.expectIsEmptyFolderSync({folderPathBox,onFolderDoesNotExist,onNotEmptyFolder});
        this.deleteFolderSync({folderPathBox,areYouSure:"YES",onFolderDoesNotExist});
    }
    /**
     * Returns the FolderPaths and FilePaths that are immediate children of this FolderPath.
     * 
     * @throws {AbstractFileSystemBox__FolderDoesNotExist}
     */
    getChildrenSync({
        folderPathBox,
        onFolderDoesNotExist,
    }:{
        folderPathBox:FolderPathBox,
        onFolderDoesNotExist:OnException,
    }){
        const results:(FilePathBox|FolderPathBox)[] = [];
        this.expectFolderExistsSync({folderPathBox,onFolderDoesNotExist});
        const childNames = readdirSync(folderPathBox.getData());
        for(const childName of childNames){
            const childPath = folderPathBox.getData()+childName;
            let childBox:FilePathBox|FolderPathBox;
            if( this.isFolderSync(childPath) ){
                childBox = new FolderPathBox(childPath+"/",()=>{});
            }else{
                childBox = new FilePathBox(childPath,()=>{});
            }
            results.push(childBox);
        }
        return results;
    }
    getChildrenFolderPathsSync({
        folderPathBox,
        onFolderDoesNotExist,
    }:{
        folderPathBox:FolderPathBox,
        onFolderDoesNotExist:OnException,
    }){
        return this.getChildrenSync({folderPathBox,onFolderDoesNotExist}).filter(a=>a instanceof FolderPathBox) as FolderPathBox[];
    }
    getChildrenFilePathsSync({
        folderPathBox,
        onFolderDoesNotExist,
    }:{
        folderPathBox:FolderPathBox,
        onFolderDoesNotExist:OnException,
    }){
        return this.getChildrenSync({folderPathBox,onFolderDoesNotExist}).filter(a=>a instanceof FilePathBox) as FilePathBox[];
    }
    /**
     * Returns the FolderPaths and FilePaths that are descendants of this FolderPath.
     * @throws {AbstractFileSystemBox__FolderDoesNotExist}
     * */
    getDescendantsSync({
        folderPathBox,
        onFolderDoesNotExist,
    }:{
        folderPathBox:FolderPathBox,
        onFolderDoesNotExist:OnException,
    }){
        const results:(FilePathBox|FolderPathBox)[] = [];

        const fileSystem = this;

        function recurse(folderPathBox:FolderPathBox){
            const children = fileSystem.getChildrenSync({folderPathBox,onFolderDoesNotExist});
            for(const child of children){
                results.push(child);
                if(child instanceof FolderPathBox){
                    recurse(child);
                }
            }
        }
        recurse(folderPathBox);

        return results;
    }
    /**
     * Will make the folder (and any parent folders) exist if they don't already.
     * @throws {AbstractFileSystemBox__Conflict}
     */
    ensureFolderExistsSync({
        folderPathBox,
        onFileExistsInWayOfPath,
    }:{
        folderPathBox:FolderPathBox,
        onFileExistsInWayOfPath:OnException,
    }){
        if( this.isExistingFolderPathSync(folderPathBox) ){
            return;
        }
        this.maybeExpectSanePath(folderPathBox);
        let wipPathValue = folderPathBox.getData().startsWith("/")?"/":"";
        for(const nodeName of folderPathBox.getData().split("/").filter(_=>_)){
            wipPathValue+=nodeName+"/";
            const wipPath = new FolderPathBox(wipPathValue,()=>{});
            if( this.isExistingFilePathSync(wipPath) ){
                onFileExistsInWayOfPath?.();
                throw new Error("Cannot create folder, because a file already exists at the same pathBox: "+wipPathValue);
            }
            if( ! this.isExistingFolderPathSync(wipPath) ){
                mkdirSync(wipPathValue);
            }
        }
    }
    /** If you provided a expectSaneFilePath callback when you initialized the localfilesystem, the path will be checked here to make sure it's sane. */
    maybeExpectSanePath(pathBox: FolderPathBox|FilePathBox) {
        if(!this._needs.expectSaneFilePath){
            return;
        }
        this._needs.expectSaneFilePath(pathBox);
    }
}

