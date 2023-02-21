#include <string.h>
#include <libxml/parser.h>
#include <libxml/parserInternals.h>
#include <libxml/SAX.h>
#include <libxml/xmlschemas.h>
#include "lxml.h"

static void validationErrorFunc(void* ctx, xmlError* error) {
  validationResult* res = (validationResult*) ctx;
  if (res->errorCount >= MAX_VALIDATION_ERRORS_SIZE) {
    return;
  }

  char* msgStr = NULL;
  if (error->message != NULL) {
    msgStr = malloc(strlen(error->message));
    strcpy(msgStr, error->message);
  }

  int i = res->errorCount++;
  errMessage *msg = malloc(sizeof(errMessage));
  msg->line = error->line;
  msg->level = error->level;
  msg->message = msgStr;
  res->errors[i] = msg;
  return;
}

static xmlSAXHandler newSAXHandler() {
  xmlSAXHandler h;
  memset(&h, 0, sizeof(xmlSAXHandler));
  h.initialized = XML_SAX2_MAGIC;
  return h;
}

xmlSchemaPtr schemaParse(char* schemaPath) {
  xmlSchemaParserCtxtPtr ctx = xmlSchemaNewParserCtxt(schemaPath);
  xmlSchemaPtr schema = xmlSchemaParse(ctx);

  xmlSchemaFreeParserCtxt(ctx);

  return schema;
}

static validationResult* newValidationResult() {
	int i;
	validationResult *res;
	res = (validationResult*) malloc(sizeof(validationResult));
	for (i = 0; i < MAX_VALIDATION_ERRORS_SIZE; i++) {
		res->errors[i] = NULL;
	}
  res->errorCount = 0;
  return res;
}

void freeValidationResult(validationResult* res) {
  int i;
  for (i = 0; i < MAX_VALIDATION_ERRORS_SIZE; i++) {
		if (res->errors[i] != NULL) {
      free(res->errors[i]);
		}
	}
  free(res);
}

validationResult* validateStream(xmlSchemaPtr schema, char *xmlPath) {
  const char *user_data = "user_data";
  validationResult* res = newValidationResult();
  xmlSAXHandler h = newSAXHandler();
  xmlParserInputBufferPtr buf = xmlParserInputBufferCreateFilename(xmlPath, XML_CHAR_ENCODING_NONE);
  if (buf == NULL) {
    res->errorCode = ERR_VALIDATION_PARSER;
    return res;
  }

  xmlSchemaValidCtxtPtr ctx = xmlSchemaNewValidCtxt(schema);
  if (ctx == NULL) {
    res->errorCode = ERR_VALIDATION_CONTEXT;
    return res;
  }

  xmlSchemaSetValidStructuredErrors(ctx, validationErrorFunc, res);
  int vErr = xmlSchemaValidateStream(ctx, buf, 0, &h, (void *)user_data);
  if (vErr == -1) {
    res->errorCode = ERR_VALIDATION_STREAM;
  } else {
    res->errorCode = vErr;
  }

  xmlSchemaFreeValidCtxt(ctx);

  return res;
}
