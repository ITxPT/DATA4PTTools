#include <libxml/parser.h>
#include <libxml/parserInternals.h>
#include <libxml/SAX.h>
#include <libxml/xmlschemas.h>

#define MAX_VALIDATION_ERRORS_SIZE 1000
#define ERR_VALIDATION_PARSER -1
#define ERR_VALIDATION_CONTEXT -2
#define ERR_VALIDATION_STREAM -3

typedef struct errMessage {
  int line;
  int level;
  char* message;
  int extra;
  int col;
  char* extra1;
  char* extra2;
  char* extra3;
} errMessage;

typedef struct validationResult {
  errMessage *errors[MAX_VALIDATION_ERRORS_SIZE];
  int errorCount;
  int errorCode;
} validationResult;

// Parse xsd schema from file
xmlSchemaPtr schemaParse(char* schemaPath);

// Do a schemas validation of the given resource, it will use the SAX streamable validation internally.
validationResult* validateStream(xmlSchemaPtr schema, char* xmlPath);

// Free validation result
void freeValidationResult(validationResult* res);
