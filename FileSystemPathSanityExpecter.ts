import { FileSystemPathBox } from "./FileSystemPathBox";
import { Expect } from "away-core/Expect";


export type FileSystemPathSanityExpecter = (path:FileSystemPathBox)=>void;

export const FileSystemPathSanityExpecter__ExpectSaneFileSystemPathBasic:FileSystemPathSanityExpecter = (path)=>{
    const pathData = path.getData();
    Expect(!pathData.includes("[object Object]"),`pathData: includes "[object Object]"`,()=>{});
    Expect(!pathData.includes("*"), `pathData: includes "*"`,()=>{});
    Expect(!pathData.includes("../"), `pathData: includes ".."`,()=>{});
    Expect(pathData!=="/", `pathData: is "/"`,()=>{});
}
