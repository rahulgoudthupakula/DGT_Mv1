package com.dgt.backend.employees.controller;

import com.dgt.backend.access.security.ScopedAccess;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.nio.file.*;
import java.io.IOException;
import java.util.*;

/** Private employee files live outside release folders and are served only by the authorized controller. */
@Component
public class EmployeeDocumentStorage {
 private final ScopedAccess a;
 private final Path directory;
 public EmployeeDocumentStorage(ScopedAccess a,@Value("${app.employee-documents.directory:${user.home}/.dgt/employee-documents}") String directory){this.a=a;this.directory=Path.of(directory).toAbsolutePath().normalize();}
 private ResponseStatusException bad(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 public void save(long employee,List<MultipartFile> files,List<String> types){
  if(files==null||files.isEmpty())return;
  if(files.size()>5||types==null||types.size()!=files.size())throw bad("Upload at most five documents and choose a type for each");
  for(int i=0;i<files.size();i++){
   var file=files.get(i);String type=types.get(i);
   if(type==null||type.isBlank()||type.strip().length()>100)throw bad("Choose a document type");
   if(file.isEmpty()||file.getSize()>5*1024*1024)throw bad("Each document must be nonempty and no larger than 5 MB");
   String name=Optional.ofNullable(file.getOriginalFilename()).orElse("Document").replace('\\','/');name=name.substring(name.lastIndexOf('/')+1).replaceAll("[\\p{Cntrl}]","");
   if(name.isBlank()||name.length()>200)throw bad("Use a document filename of at most 200 characters");
   try{
    byte[] bytes=file.getBytes();String lower=name.toLowerCase(Locale.ROOT),extension;
    if(lower.endsWith(".pdf")&&bytes.length>=5&&new String(bytes,0,5,java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-"))extension="pdf";
    else if(lower.endsWith(".png")&&bytes.length>=8&&Arrays.equals(Arrays.copyOf(bytes,8),new byte[]{(byte)137,80,78,71,13,10,26,10}))extension="png";
    else if((lower.endsWith(".jpg")||lower.endsWith(".jpeg"))&&bytes.length>=3&&(bytes[0]&255)==255&&(bytes[1]&255)==216&&(bytes[2]&255)==255)extension="jpg";
    else throw bad("Use a valid PDF, JPG, JPEG or PNG document");
    Files.createDirectories(directory);
    if(Files.getFileStore(directory).supportsFileAttributeView("posix"))Files.setPosixFilePermissions(directory,java.nio.file.attribute.PosixFilePermissions.fromString("rwx------"));
    String key=UUID.randomUUID()+"."+extension;Path target=directory.resolve(key);
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCompletion(int status){if(status!=STATUS_COMMITTED)try{Files.deleteIfExists(target);}catch(IOException ignored){}}});
    Files.write(target,bytes,StandardOpenOption.CREATE_NEW);
    if(Files.getFileStore(target).supportsFileAttributeView("posix"))Files.setPosixFilePermissions(target,java.nio.file.attribute.PosixFilePermissions.fromString("rw-------"));
    a.db.update("INSERT INTO employee_documents(employee_id,document_type,document_name,document_url) VALUES (?,?,?,?)",employee,type.strip(),name,"private:"+key);
   }catch(IOException ex){throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Document storage is unavailable. Employee changes were not saved.");}
  }
 }
 public Path file(String key){
  if(key==null||!key.matches("private:[0-9a-f-]{36}\\.(pdf|png|jpg)"))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"This document is not available for download");
  Path file=directory.resolve(key.substring(8));
  if(!Files.isRegularFile(file,LinkOption.NOFOLLOW_LINKS))throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Document file is unavailable");
  return file;
 }
}
