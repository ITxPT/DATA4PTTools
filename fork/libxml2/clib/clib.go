package clib

/*
#cgo pkg-config: libxml-2.0
#include <libxml/parserInternals.h>
#include <libxml/xpathInternals.h>
#include <libxml/xmlschemas.h>
#include <string.h>

#define MAX_VALIDATION_ERRORS_SIZE 10000

// Macro wrapper function. cgo cannot detect function-like macros, so this is how we avoid it
static inline void MY_xmlFree(void *p) { xmlFree(p); }
static inline xmlError* MY_xmlLastError() { return xmlGetLastError(); }
static inline xmlError* MY_xmlCtxtLastError(void *ctx) { return xmlCtxtGetLastError(ctx); }

// For reference:
// struct _xmlError {
//     int	domain	: What part of the library raised this er
//     int	code	: The error code, e.g. an xmlParserError
//     char *	message	: human-readable informative error messag
//     xmlErrorLevel	level	: how consequent is the error
//     char *	file	: the filename
//     int	line	: the line number if available
//     char *	str1	: extra string information
//     char *	str2	: extra string information
//     char *	str3	: extra string information
//     int	int1	: extra number information
//     int	int2	: error column # or 0 if N/A (todo: renam
//     void *	ctxt	: the parser context if available
//     void *	node	: the node in the tree
// }
typedef struct err_message {
  int line;
  int level;
  char *message;
  int extra;
  int col;
  char * extra1;
  char * extra2;
  char * extra3;
} err_message;

typedef struct validation_result {
  err_message *errors[MAX_VALIDATION_ERRORS_SIZE];
	int index;
  int count;
} validation_result;

static void freeValidationResult(validation_result* ctx) {
	int i = 0;
	for (i = 0; i < MAX_VALIDATION_ERRORS_SIZE; i++) {
		if (ctx->errors[i] != NULL) {
			free(ctx->errors[i]);
		}
	}
	free(ctx);
}

static void structuredErrFunc(void *ctx, xmlError *error) {
  validation_result *accum = (validation_result *) ctx;

  accum->count++;
  if (accum->index >= MAX_VALIDATION_ERRORS_SIZE) {
    return;
  }

  char * errorMessage;
  char * extra1;
  char * extra2;
  char * extra3;

  if (error->message != NULL) {
    errorMessage = malloc(strlen(error->message));
    strcpy(errorMessage, error->message);
  }
  if (error->str1 != NULL) {
    extra1 = malloc(strlen(error->str1));
    strcpy(extra1, error->str1);
  }
  if (error->str2 != NULL) {
    extra2 = malloc(strlen(error->str2));
    strcpy(extra2, error->str2);
  }
  if (error->str3 != NULL) {
    extra3 = malloc(strlen(error->str3));
    strcpy(extra3, error->str3);
  }

  int i = accum->index++;
  err_message *msg = malloc(sizeof(err_message));
  msg->line = error->line;
  msg->level = error->level;
  msg->message = errorMessage;
  msg->extra = error->int1;
  msg->col = error->int2;
  msg->extra1 = extra1;
  msg->extra2 = extra2;
  msg->extra3 = extra3;
  accum->errors[i] = msg;
}

static validation_result* setValidityFunc(xmlSchemaValidCtxtPtr ctxt) {
	int i;
	validation_result *ctx;
	ctx = (validation_result *) malloc(sizeof(validation_result));
	for (i = 0; i < MAX_VALIDATION_ERRORS_SIZE; i++) {
		ctx->errors[i] = NULL;
	}
	ctx->index = 0;
  ctx->count = 0;

  xmlSchemaSetValidStructuredErrors(ctxt, structuredErrFunc, ctx);

  return ctx;
}
*/
import "C"
import (
	"fmt"
	"reflect"
	"strings"
	"unsafe"

	"github.com/lestrrat-go/libxml2/internal/debug"
	"github.com/lestrrat-go/libxml2/internal/option"
	"github.com/pkg/errors"
)

func validDocumentPtr(doc PtrSource) (*C.xmlDoc, error) {
	if doc == nil {
		return nil, ErrInvalidDocument
	}

	if dptr := doc.Pointer(); dptr != 0 {
		return (*C.xmlDoc)(unsafe.Pointer(dptr)), nil
	}
	return nil, ErrInvalidDocument
}

func validParserCtxtPtr(s PtrSource) (*C.xmlParserCtxt, error) {
	if s == nil {
		return nil, ErrInvalidParser
	}

	if ptr := s.Pointer(); ptr != 0 {
		return (*C.xmlParserCtxt)(unsafe.Pointer(s.Pointer())), nil
	}
	return nil, ErrInvalidParser
}

func validNodePtr(n PtrSource) (*C.xmlNode, error) {
	if n == nil {
		return nil, ErrInvalidNode
	}

	// XML_GET_LINE

	nptr := n.Pointer()
	if nptr == 0 {
		return nil, ErrInvalidNode
	}

	return (*C.xmlNode)(unsafe.Pointer(nptr)), nil
}

func validAttributePtr(n PtrSource) (*C.xmlAttr, error) {
	if n == nil {
		return nil, ErrInvalidAttribute
	}

	if nptr := n.Pointer(); nptr != 0 {
		return (*C.xmlAttr)(unsafe.Pointer(nptr)), nil
	}

	return nil, ErrInvalidAttribute
}

func validXPathContextPtr(x PtrSource) (*C.xmlXPathContext, error) {
	if x == nil {
		return nil, ErrInvalidXPathContext
	}

	if xptr := x.Pointer(); xptr != 0 {
		return (*C.xmlXPathContext)(unsafe.Pointer(xptr)), nil
	}
	return nil, ErrInvalidXPathContext
}

func validXPathExpressionPtr(x PtrSource) (*C.xmlXPathCompExpr, error) {
	if x == nil {
		return nil, ErrInvalidXPathExpression
	}

	if xptr := x.Pointer(); xptr != 0 {
		return (*C.xmlXPathCompExpr)(unsafe.Pointer(xptr)), nil
	}
	return nil, ErrInvalidXPathExpression
}

func validXPathObjectPtr(x PtrSource) (*C.xmlXPathObject, error) {
	if x == nil {
		return nil, ErrInvalidXPathObject
	}

	if xptr := x.Pointer(); xptr != 0 {
		return (*C.xmlXPathObject)(unsafe.Pointer(xptr)), nil
	}
	return nil, ErrInvalidXPathObject
}

func xmlCtxtLastError(ctx PtrSource) error {
	return xmlCtxtLastErrorRaw(ctx.Pointer())
}

func xmlCtxtLastErrorRaw(ctx uintptr) error {
	e := C.MY_xmlCtxtLastError(unsafe.Pointer(ctx))
	if e == nil {
		return errors.New(`unknown error`)
	}
	msg := strings.TrimSuffix(C.GoString(e.message), "\n")
	return errors.Errorf("Entity: line %v: parser error : %v", e.line, msg)
}

func xmlCharToString(s *C.xmlChar) string {
	return C.GoString((*C.char)(unsafe.Pointer(s)))
}

// stringToXMLChar creates a new *C.xmlChar from a Go string.
// Remember to always free this data, as C.CString creates a copy
// of the byte buffer contained in the string
func stringToXMLChar(s string) *C.xmlChar {
	return (*C.xmlChar)(unsafe.Pointer(C.CString(s)))
}

func XMLSchemaParseFromFile(path string) (uintptr, error) {
	parserCtx := C.xmlSchemaNewParserCtxt(C.CString(path))
	if parserCtx == nil {
		return 0, errors.New("failed to create parser")
	}
	defer C.xmlSchemaFreeParserCtxt(parserCtx)

	s := C.xmlSchemaParse(parserCtx)
	if s == nil {
		return 0, errors.New("failed to parse schema")
	}

	return uintptr(unsafe.Pointer(s)), nil
}

func XMLCreateMemoryParserCtxt(s string, o int) (uintptr, error) {
	cs := C.CString(s)
	defer C.free(unsafe.Pointer(cs))
	ctx := C.xmlCreateMemoryParserCtxt(cs, C.int(len(s)))
	if ctx == nil {
		return 0, errors.New("error creating parser")
	}
	C.xmlCtxtUseOptions(ctx, C.int(o))

	return uintptr(unsafe.Pointer(ctx)), nil
}

func XMLParseDocument(ctx PtrSource) error {
	ctxptr, err := validParserCtxtPtr(ctx)
	if err != nil {
		return err
	}

	if C.xmlParseDocument(ctxptr) != C.int(0) {
		return errors.Errorf("parse failed: %v", xmlCtxtLastError(ctx))
	}
	return nil
}

func XMLFreeParserCtxt(ctx PtrSource) error {
	ctxptr, err := validParserCtxtPtr(ctx)
	if err != nil {
		return err
	}

	C.xmlFreeParserCtxt(ctxptr)
	return nil
}

func XMLEncodeEntitiesReentrant(docptr *C.xmlDoc, s string) (*C.xmlChar, error) {
	cent := stringToXMLChar(s)
	defer C.free(unsafe.Pointer(cent))

	return C.xmlEncodeEntitiesReentrant(docptr, cent), nil
}

func validNamespacePtr(s PtrSource) (*C.xmlNs, error) {
	if s == nil {
		return nil, ErrInvalidNamespace
	}

	if ptr := s.Pointer(); ptr != 0 {
		return (*C.xmlNs)(unsafe.Pointer(ptr)), nil
	}
	return nil, ErrInvalidNamespace
}

func XMLNodeLine(n PtrSource) (int, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}

	return int(nptr.line), nil
}

func XMLNodeName(n PtrSource) (string, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return "", err
	}

	var s string
	switch XMLNodeType(nptr._type) {
	case XIncludeStart, XIncludeEnd, EntityRefNode, EntityNode, DTDNode, EntityDecl, DocumentTypeNode, NotationNode, NamespaceDecl:
		s = xmlCharToString(nptr.name)
	case CommentNode:
		s = "#comment"
	case CDataSectionNode:
		s = "#cdata-section"
	case TextNode:
		s = "#text"
	case DocumentNode, HTMLDocumentNode, DocbDocumentNode:
		s = "#document"
	case DocumentFragNode:
		s = "#document-fragment"
	case ElementNode, AttributeNode:
		if ns := nptr.ns; ns != nil {
			if nsstr := xmlCharToString(ns.prefix); nsstr != "" {
				s = fmt.Sprintf("%s:%s", xmlCharToString(ns.prefix), xmlCharToString(nptr.name))
			}
		}

		if s == "" {
			s = xmlCharToString(nptr.name)
		}
	case ElementDecl, AttributeDecl:
		panic("unimplemented")
	default:
		panic("unknown")
	}

	return s, nil
}

func XMLNodeValue(n PtrSource) (string, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return "", err
	}

	var s string
	switch XMLNodeType(nptr._type) {
	case AttributeNode, ElementNode, TextNode, CommentNode, PiNode, EntityRefNode:
		xc := C.xmlXPathCastNodeToString(nptr)
		s = xmlCharToString(xc)
		C.MY_xmlFree(unsafe.Pointer(xc))
	case CDataSectionNode, EntityDecl:
		if nptr.content != nil {
			xc := C.xmlStrdup(nptr.content)
			s = xmlCharToString(xc)
			C.MY_xmlFree(unsafe.Pointer(xc))
		}
	default:
		panic("unimplmented")
	}

	return s, nil
}

func XMLOwnerDocument(n PtrSource) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}

	if nptr.doc == nil {
		return 0, ErrInvalidDocument
	}
	return uintptr(unsafe.Pointer(nptr.doc)), nil
}

func XMLFirstChild(n PtrSource) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}

	if !XMLHasChildNodes(n) {
		return 0, errors.New("no children")
	}

	return uintptr(unsafe.Pointer(nptr.children)), nil
}

func XMLHasChildNodes(n PtrSource) bool {
	nptr, err := validNodePtr(n)
	if err != nil {
		return false
	}
	return nptr.children != nil
}

func XMLLastChild(n PtrSource) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}
	return uintptr(unsafe.Pointer(nptr.last)), nil
}

func XMLLocalName(n PtrSource) string {
	nptr, err := validNodePtr(n)
	if err != nil {
		return ""
	}

	switch XMLNodeType(nptr._type) {
	case ElementNode, AttributeNode, ElementDecl, AttributeDecl:
		return xmlCharToString(nptr.name)
	}
	return ""
}

func XMLNamespaceURI(n PtrSource) string {
	nptr, err := validNodePtr(n)
	if err != nil {
		return ""
	}

	switch XMLNodeType(nptr._type) {
	case ElementNode, AttributeNode, PiNode:
		if ns := nptr.ns; ns != nil && ns.href != nil {
			return xmlCharToString(ns.href)
		}
	}
	return ""
}

func XMLNextSibling(n PtrSource) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}
	return uintptr(unsafe.Pointer(nptr.next)), nil
}

func XMLParentNode(n PtrSource) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}
	return uintptr(unsafe.Pointer(nptr.parent)), nil
}

func XMLPrefix(n PtrSource) string {
	nptr, err := validNodePtr(n)
	if err != nil {
		return ""
	}

	switch XMLNodeType(nptr._type) {
	case ElementNode, AttributeNode, PiNode:
		if ns := nptr.ns; ns != nil && ns.prefix != nil {
			return xmlCharToString(ns.prefix)
		}
	}
	return ""
}

func XMLPreviousSibling(n PtrSource) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}
	return uintptr(unsafe.Pointer(nptr.prev)), nil
}

func XMLSetNodeName(n PtrSource, name string) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}
	cname := stringToXMLChar(name)
	defer C.free(unsafe.Pointer(cname))
	C.xmlNodeSetName(nptr, cname)
	return nil
}

func XMLSetNodeValue(n PtrSource, value string) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}
	cvalue := stringToXMLChar(value)
	defer C.free(unsafe.Pointer(cvalue))

	// TODO: Implement this in C
	if XMLNodeType(nptr._type) != AttributeNode {
		C.xmlNodeSetContent(nptr, cvalue)
		return nil
	}

	if nptr.children != nil {
		nptr.last = nil
		C.xmlFreeNodeList(nptr.children)
	}

	nptr.children = C.xmlNewText(cvalue)
	nptr.children.parent = nptr
	nptr.children.doc = nptr.doc
	nptr.last = nptr.children
	return nil
}

func XMLTextContent(n PtrSource) string {
	nptr, err := validNodePtr(n)
	if err != nil {
		return ""
	}
	return xmlCharToString(C.xmlXPathCastNodeToString(nptr))
}

func XMLToString(n PtrSource, format int, docencoding bool) string {
	nptr, err := validNodePtr(n)
	if err != nil {
		return ""
	}

	buffer := C.xmlBufferCreate()
	defer C.xmlBufferFree(buffer)

	if format <= 0 {
		C.xmlNodeDump(buffer, nptr.doc, nptr, 0, 0)
	} else {
		C.xmlNodeDump(buffer, nptr.doc, nptr, 0, C.int(format))
	}
	return xmlCharToString(C.xmlBufferContent(buffer))
}

func XMLLookupNamespacePrefix(n PtrSource, href string) (string, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return "", err
	}

	if href == "" {
		return "", ErrNamespaceNotFound{Target: href}
	}

	chref := stringToXMLChar(href)
	defer C.free(unsafe.Pointer(chref))
	ns := C.xmlSearchNsByHref(nptr.doc, nptr, chref)
	if ns == nil {
		return "", ErrNamespaceNotFound{Target: href}
	}

	return xmlCharToString(ns.prefix), nil
}

func XMLLookupNamespaceURI(n PtrSource, prefix string) (string, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return "", err
	}

	if prefix == "" {
		return "", ErrNamespaceNotFound{Target: prefix}
	}

	cprefix := stringToXMLChar(prefix)
	defer C.free(unsafe.Pointer(cprefix))
	ns := C.xmlSearchNs(nptr.doc, nptr, cprefix)
	if ns == nil {
		return "", ErrNamespaceNotFound{Target: prefix}
	}

	return xmlCharToString(ns.href), nil
}

func XMLGetNodeTypeRaw(n uintptr) XMLNodeType {
	nptr := (*C.xmlNode)(unsafe.Pointer(n))
	return XMLNodeType(nptr._type)
}

func XMLGetNodeType(n PtrSource) XMLNodeType {
	nptr, err := validNodePtr(n)
	if err != nil {
		return XMLNodeType(0)
	}
	return XMLNodeType(nptr._type)
}

func XMLChildNodes(n PtrSource) ([]uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get valid node for XMLChildNodes")
	}

	ret := []uintptr(nil)
	for chld := nptr.children; chld != nil; chld = chld.next {
		ret = append(ret, uintptr(unsafe.Pointer(chld)))
	}
	return ret, nil
}

type stringer interface {
	String() string
}

func XMLRemoveChild(n PtrSource, t PtrSource) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return errors.Wrap(err, "failed to get valid node for XMLRemoveChild")
	}

	tptr, err := validNodePtr(t)
	if err != nil {
		return errors.Wrap(err, "failed to get valid node for XMLRemoveChild")
	}

	switch XMLNodeType(tptr._type) {
	case AttributeNode, NamespaceDecl:
		return nil
	}

	if tptr.parent != nptr {
		return nil /* not a child! */
	}

	unlinkNode(tptr)
	if XMLNodeType(tptr._type) == ElementNode {
		reconcileNs(tptr)
	}

	return nil
}

func unlinkNode(nptr *C.xmlNode) {
	if nptr == nil || (nptr.prev == nil && nptr.next == nil && nptr.parent == nil) {
		return
	}

	if XMLNodeType(nptr._type) == DTDNode {
		/* This clears the doc->intSubset pointer. */
		C.xmlUnlinkNode(nptr)
		return
	}

	if nptr.prev != nil {
		nptr.prev.next = nptr.next
	}

	if nptr.next != nil {
		nptr.next.prev = nptr.prev
	}

	if nptr.parent != nil {
		if nptr == nptr.parent.last {
			nptr.parent.last = nptr.prev
		}

		if nptr == nptr.parent.children {
			nptr.parent.children = nptr.next
		}
	}

	nptr.prev = nil
	nptr.next = nil
	nptr.parent = nil
}

func reconcileNs(tree *C.xmlNode) {
	var unused *C.xmlNs
	reconcileNsSave(tree, &unused)
	if unused != nil {
		C.xmlFreeNsList(unused)
	}
}

func addNsChain(n *C.xmlNs, ns *C.xmlNs) *C.xmlNs {
	if n == nil {
		return ns
	}

	for i := n; i != nil && i != ns; i = i.next {
		if i == nil {
			ns.next = n
			return ns
		}
	}

	return n
}

func addNsDef(tree *C.xmlNode, ns *C.xmlNs) {
	i := tree.nsDef
	for ; i != nil && i != ns; i = i.next {
	}

	if i == nil {
		ns.next = tree.nsDef
		tree.nsDef = ns
	}
}

func removeNsDef(tree *C.xmlNode, ns *C.xmlNs) bool {
	if ns == tree.nsDef {
		tree.nsDef = tree.nsDef.next
		ns.next = nil
		return true
	}

	for i := tree.nsDef; i != nil; i = i.next {
		if i.next == ns {
			i.next = ns.next
			ns.next = nil
			return true
		}
	}

	return false
}

func reconcileNsSave(tree *C.xmlNode, unused **C.xmlNs) {
	if tree.ns != nil && (XMLNodeType(tree._type) == ElementNode || XMLNodeType(tree._type) == AttributeNode) {
		ns := C.xmlSearchNs(tree.doc, tree.parent, tree.ns.prefix)
		if ns != nil && ns.href != nil && tree.ns.href != nil && C.xmlStrcmp(ns.href, tree.ns.href) == 0 {
			/* Remove the declaration (if present) */
			if removeNsDef(tree, tree.ns) {
				/* Queue the namespace for freeing */

				*unused = addNsChain(*unused, tree.ns)
			}
			/* Replace the namespace with the one found */

			tree.ns = ns
		} else {
			/* If the declaration is here, we don't need to do anything */
			if removeNsDef(tree, tree.ns) {
				addNsDef(tree, tree.ns)
			} else {
				/* Restart the namespace at this point */
				tree.ns = C.xmlCopyNamespace(tree.ns)
				addNsDef(tree, tree.ns)
			}
		}
	}
}

func SplitPrefixLocal(s string) (string, string) {
	i := strings.IndexByte(s, ':')
	if i == -1 {
		return "", s
	}
	return s[:i], s[i+1:]
}

func XMLNamespaceHref(n PtrSource) string {
	nsptr, err := validNamespacePtr(n)
	if err != nil {
		return ""
	}
	return xmlCharToString(nsptr.href)
}

func XMLNamespacePrefix(n PtrSource) string {
	nsptr, err := validNamespacePtr(n)
	if err != nil {
		return ""
	}
	return xmlCharToString(nsptr.prefix)
}

func XMLNamespaceFree(n PtrSource) {
	nsptr, err := validNamespacePtr(n)
	if err != nil {
		return
	}
	C.MY_xmlFree(unsafe.Pointer(nsptr))
}

func XMLDocumentEncoding(doc PtrSource) string {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return ""
	}
	return xmlCharToString(dptr.encoding)
}

func XMLDocumentStandalone(doc PtrSource) int {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return 0
	}
	return int(dptr.standalone)
}

func XMLDocumentURI(doc PtrSource) string {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return ""
	}
	return xmlCharToString(dptr.URL)
}

func XMLDocumentVersion(doc PtrSource) string {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return ""
	}
	return xmlCharToString(dptr.version)
}

func XMLDocumentElement(doc PtrSource) (uintptr, error) {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return 0, err
	}

	ptr := C.xmlDocGetRootElement(dptr)
	if ptr == nil {
		return 0, errors.New("no document element found")
	}
	return uintptr(unsafe.Pointer(ptr)), nil
}

func XMLFreeDoc(doc PtrSource) error {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return err
	}
	C.xmlFreeDoc(dptr)
	return nil
}

func XMLDocumentString(doc PtrSource, encoding string, format bool) string {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return ""
	}

	var intformat C.int
	if format {
		intformat = C.int(1)
	} else {
		intformat = C.int(0)
	}

	// Ideally this shouldn't happen, but you never know.
	if encoding == "" {
		encoding = "utf-8"
	}

	var xcencoding [MaxEncodingLength]C.char
	for i := 0; i < len(encoding); i++ {
		xcencoding[i] = C.char(encoding[i])
	}
	xcencodingptr := (uintptr)(unsafe.Pointer(&xcencoding[0]))

	var i C.int
	var xc *C.xmlChar
	C.xmlDocDumpFormatMemoryEnc(dptr, &xc, &i, (*C.char)(unsafe.Pointer(xcencodingptr)), intformat)

	defer C.MY_xmlFree(unsafe.Pointer(xc))
	return xmlCharToString(xc)
}

func XMLNodeSetBase(doc PtrSource, s string) {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return
	}

	cs := stringToXMLChar(s)
	defer C.free(unsafe.Pointer(cs))
	C.xmlNodeSetBase((*C.xmlNode)(unsafe.Pointer(dptr)), cs)
}

func XMLSetDocumentElement(doc PtrSource, n PtrSource) error {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return err
	}

	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}

	C.xmlDocSetRootElement(dptr, nptr)
	return nil
}

func XMLSetDocumentEncoding(doc PtrSource, e string) {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return
	}

	if dptr.encoding != nil {
		C.MY_xmlFree(unsafe.Pointer(dptr.encoding))
	}

	// note: this doesn't need to be dup'ed, as
	// C.CString is already duped/malloc'ed
	dptr.encoding = stringToXMLChar(e)
}

func XMLSetDocumentStandalone(doc PtrSource, v int) {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return
	}
	dptr.standalone = C.int(v)
}

func XMLSetDocumentVersion(doc PtrSource, v string) {
	dptr, err := validDocumentPtr(doc)
	if err != nil {
		return
	}

	if dptr.version != nil {
		C.MY_xmlFree(unsafe.Pointer(dptr.version))
	}

	// note: this doesn't need to be dup'ed, as
	// C.CString is already duped/malloc'ed
	dptr.version = stringToXMLChar(v)
}

func XMLSetProp(n PtrSource, name, value string) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}

	if len(name) > MaxAttributeNameLength {
		return ErrAttributeNameTooLong
	}

	var xcname [MaxAttributeNameLength]C.xmlChar
	for i := 0; i < len(name); i++ {
		xcname[i] = C.xmlChar(name[i])
	}
	xcnameptr := (uintptr)(unsafe.Pointer(&xcname[0]))

	if len(value) > MaxValueBufferSize {
		return ErrValueTooLong
	}
	var xcvalue [MaxValueBufferSize]C.xmlChar
	for i := 0; i < len(value); i++ {
		xcvalue[i] = C.xmlChar(value[i])
	}
	xcvalueptr := (uintptr)(unsafe.Pointer(&xcvalue[0]))

	C.xmlSetProp(
		nptr,
		(*C.xmlChar)(unsafe.Pointer(xcnameptr)),
		(*C.xmlChar)(unsafe.Pointer(xcvalueptr)),
	)
	return nil
}

func XMLElementAttributes(n PtrSource) ([]uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get valid node for XMLElementAttributes")
	}

	attrs := []uintptr{}
	for attr := nptr.properties; attr != nil; attr = attr.next {
		attrs = append(attrs, uintptr(unsafe.Pointer(attr)))
	}
	return attrs, nil
}

func XMLElementNamespaces(n PtrSource) ([]uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get valid node for XMLElementNamespaces")
	}

	ret := []uintptr{}
	for ns := nptr.nsDef; ns != nil; ns = ns.next {
		if ns.prefix == nil && ns.href == nil {
			continue
		}
		// ALERT! Allocating new C struct here
		newns := C.xmlCopyNamespace(ns)
		if newns == nil { // XXX this is an error, no?
			continue
		}

		ret = append(ret, uintptr(unsafe.Pointer(newns)))
	}
	return ret, nil
}

func XMLElementGetAttributeNode(n PtrSource, name string) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}

	// if this is "xmlns", look for the first namespace without
	// the prefix
	if name == "xmlns" {
		for nsdef := nptr.nsDef; nsdef != nil; nsdef = nsdef.next {
			if nsdef.prefix != nil {
				continue
			}
			if debug.Enabled {
				debug.Printf("nsdef.href -> %s", xmlCharToString(nsdef.href))
			}
		}
	}

	cname := stringToXMLChar(name)
	defer C.free(unsafe.Pointer(cname))

	prop := C.xmlHasNsProp(nptr, cname, nil)
	if debug.Enabled {
		debug.Printf("prop = %v", prop)
	}

	if prop == nil {
		prefix, local := SplitPrefixLocal(name)
		if debug.Enabled {
			debug.Printf("prefix = %s, local = %s", prefix, local)
		}
		if local != "" {
			cprefix := stringToXMLChar(prefix)
			defer C.free(unsafe.Pointer(cprefix))
			if ns := C.xmlSearchNs(nptr.doc, nptr, cprefix); ns != nil {
				clocal := stringToXMLChar(local)
				defer C.free(unsafe.Pointer(clocal))

				prop = C.xmlHasNsProp(nptr, clocal, ns.href)
			}

		}
	}

	if prop == nil || XMLNodeType(prop._type) != AttributeNode {
		return 0, ErrAttributeNotFound
	}

	return uintptr(unsafe.Pointer(prop)), nil
}

func XMLFreeProp(attr PtrSource) error {
	nptr, err := validAttributePtr(attr)
	if err != nil {
		return err
	}
	C.xmlFreeProp(nptr)
	return nil
}

func XMLFreeNode(n PtrSource) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}
	C.xmlFreeNode(nptr)
	return nil
}

func XMLUnsetProp(n PtrSource, name string) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}

	cname := stringToXMLChar(name)
	defer C.free(unsafe.Pointer(cname))

	i := C.xmlUnsetProp(nptr, cname)
	if i == C.int(0) {
		return errors.New("failed to unset prop")
	}
	return nil
}

func XMLUnsetNsProp(n PtrSource, ns PtrSource, name string) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}

	nsptr, err := validNamespacePtr(ns)
	if err != nil {
		return err
	}

	cname := stringToXMLChar(name)
	defer C.free(unsafe.Pointer(cname))

	i := C.xmlUnsetNsProp(
		nptr,
		nsptr,
		cname,
	)
	if i == C.int(0) {
		return errors.New("failed to unset prop")
	}
	return nil
}

func XMLAppendText(n PtrSource, s string) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}

	cs := stringToXMLChar(s)
	defer C.free(unsafe.Pointer(cs))

	txt := C.xmlNewText(cs)
	if txt == nil {
		return errors.New("failed to create text node")
	}

	if C.xmlAddChild(nptr, (*C.xmlNode)(txt)) == nil {
		return errors.New("failed to create text node")
	}
	return nil
}

func XMLDocCopyNode(n PtrSource, d PtrSource, extended int) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}

	dptr, err := validDocumentPtr(d)
	if err != nil {
		return 0, err
	}

	ret := C.xmlDocCopyNode(nptr, dptr, C.int(extended))
	if ret == nil {
		return 0, errors.New("copy node failed")
	}

	return uintptr(unsafe.Pointer(ret)), nil
}

func XMLSetTreeDoc(n PtrSource, d PtrSource) error {
	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}

	dptr, err := validDocumentPtr(d)
	if err != nil {
		return err
	}

	C.xmlSetTreeDoc(nptr, dptr)
	return nil
}

func XMLParseInNodeContext(n PtrSource, data string, o int) (uintptr, error) {
	nptr, err := validNodePtr(n)
	if err != nil {
		return 0, err
	}

	var ret C.xmlNodePtr
	cdata := C.CString(data)
	defer C.free(unsafe.Pointer(cdata))
	if C.xmlParseInNodeContext(nptr, cdata, C.int(len(data)), C.int(o), &ret) != 0 {
		return 0, errors.New("XXX PLACE HOLDER XXX")
	}

	return uintptr(unsafe.Pointer(ret)), nil
}

func XMLXPathNewContext(n PtrSource) (uintptr, error) {
	ctx := C.xmlXPathNewContext(nil)
	ctx.namespaces = nil

	nptr, err := validNodePtr(n)
	if err == nil {
		ctx.node = (*C.xmlNode)(unsafe.Pointer(nptr))
	}

	return uintptr(unsafe.Pointer(ctx)), nil
}

func XMLXPathContextSetContextNode(x PtrSource, n PtrSource) error {
	xptr, err := validXPathContextPtr(x)
	if err != nil {
		return err
	}

	nptr, err := validNodePtr(n)
	if err != nil {
		return err
	}

	xptr.node = nptr
	return nil
}

func XMLXPathCompile(s string) (uintptr, error) {
	if len(s) > MaxXPathExpressionLength {
		return 0, ErrXPathExpressionTooLong
	}

	var xcs [MaxXPathExpressionLength]C.xmlChar
	for i := 0; i < len(s); i++ {
		xcs[i] = C.xmlChar(s[i])
	}
	xcsptr := (uintptr)(unsafe.Pointer(&xcs[0]))

	if p := C.xmlXPathCompile((*C.xmlChar)(unsafe.Pointer(xcsptr))); p != nil {
		return uintptr(unsafe.Pointer(p)), nil
	}
	return 0, ErrXPathCompileFailure
}

func XMLXPathFreeCompExpr(x PtrSource) error {
	xptr, err := validXPathExpressionPtr(x)
	if err != nil {
		return err
	}
	C.xmlXPathFreeCompExpr(xptr)
	return nil
}

func XMLXPathFreeContext(x PtrSource) error {
	xptr, err := validXPathContextPtr(x)
	if err != nil {
		return err
	}
	C.xmlXPathFreeContext(xptr)
	return nil
}

func XMLXPathNSLookup(x PtrSource, prefix string) (string, error) {
	xptr, err := validXPathContextPtr(x)
	if err != nil {
		return "", err
	}

	cprefix := stringToXMLChar(prefix)
	defer C.free(unsafe.Pointer(cprefix))

	if s := C.xmlXPathNsLookup(xptr, cprefix); s != nil {
		return xmlCharToString(s), nil
	}

	return "", ErrNamespaceNotFound{Target: prefix}
}

func XMLXPathRegisterNS(x PtrSource, prefix, nsuri string) error {
	xptr, err := validXPathContextPtr(x)
	if err != nil {
		return err
	}

	if len(prefix) > MaxElementNameLength {
		return ErrElementNameTooLong
	}
	var cprefix [MaxElementNameLength]C.xmlChar
	for i := 0; i < len(prefix); i++ {
		cprefix[i] = C.xmlChar(prefix[i])
	}
	cprefixptr := (uintptr)(unsafe.Pointer(&cprefix[0]))

	if len(nsuri) > MaxNamespaceURILength {
		return ErrNamespaceURITooLong
	}
	var cnsuri [MaxNamespaceURILength]C.xmlChar
	for i := 0; i < len(nsuri); i++ {
		cnsuri[i] = C.xmlChar(nsuri[i])
	}
	cnsuriptr := (uintptr)(unsafe.Pointer(&cnsuri[0]))

	if res := C.xmlXPathRegisterNs(xptr, (*C.xmlChar)(unsafe.Pointer(cprefixptr)), (*C.xmlChar)(unsafe.Pointer(cnsuriptr))); res == -1 {
		return ErrXPathNamespaceRegisterFailure
	}
	return nil
}

func XMLEvalXPath(x PtrSource, expr PtrSource) (uintptr, error) {
	xptr, err := validXPathContextPtr(x)
	if err != nil {
		return 0, err
	}

	exprptr, err := validXPathExpressionPtr(expr)
	if err != nil {
		return 0, err
	}

	// If there is no document associated with this context,
	// then xmlXPathCompiledEval() just fails to match
	if xptr.node != nil && xptr.node.doc != nil {
		xptr.doc = xptr.node.doc
	}

	if xptr.doc == nil {
		var xcv [3]C.xmlChar = [3]C.xmlChar{'1', '.', '0'}
		xcvptr := (uintptr)(unsafe.Pointer(&xcv[0]))
		xptr.doc = C.xmlNewDoc((*C.xmlChar)(unsafe.Pointer(xcvptr)))

		defer C.xmlFreeDoc(xptr.doc)
	}

	res := C.xmlXPathCompiledEval(exprptr, xptr)
	if res == nil {
		return 0, ErrXPathEmptyResult
	}

	return uintptr(unsafe.Pointer(res)), nil
}

func XMLXPathFreeObject(x PtrSource) {
	xptr, err := validXPathObjectPtr(x)
	if err != nil {
		return
	}
	C.xmlXPathFreeObject(xptr)
}

func XMLXPathObjectNodeListLen(x PtrSource) int {
	xptr, err := validXPathObjectPtr(x)
	if err != nil {
		return 0
	}

	if xptr.nodesetval == nil {
		return 0
	}

	return int(xptr.nodesetval.nodeNr)
}

func XMLXPathObjectType(x PtrSource) XPathObjectType {
	xptr, err := validXPathObjectPtr(x)
	if err != nil {
		return XPathUndefinedType
	}
	return XPathObjectType(xptr._type)
}

func XMLXPathObjectFloat64(x PtrSource) float64 {
	xptr, err := validXPathObjectPtr(x)
	if err != nil {
		return float64(0)
	}

	return float64(xptr.floatval)
}

func XMLXPathObjectBool(x PtrSource) bool {
	xptr, err := validXPathObjectPtr(x)
	if err != nil {
		return false
	}

	return C.int(xptr.boolval) == 1
}

func XMLXPathObjectNodeList(x PtrSource) ([]uintptr, error) {
	// Probably needs NodeList iterator
	xptr, err := validXPathObjectPtr(x)
	if err != nil {
		return nil, errors.Wrap(err, "failed to get valid xpath object for XMLXPathObjectNodeList")
	}

	nodeset := xptr.nodesetval
	if nodeset == nil {
		return nil, errors.Wrap(ErrInvalidNode, "failed to get valid node for XMLXPathObjectNodeList")
	}

	if nodeset.nodeNr == 0 {
		return nil, errors.Wrap(ErrInvalidNode, "failed to get valid node for XMLXPathObjectNodeList")
	}

	hdr := reflect.SliceHeader{
		Data: uintptr(unsafe.Pointer(nodeset.nodeTab)),
		Len:  int(nodeset.nodeNr),
		Cap:  int(nodeset.nodeNr),
	}
	nodes := *(*[]*C.xmlNode)(unsafe.Pointer(&hdr))

	ret := make([]uintptr, nodeset.nodeNr)
	for i := 0; i < int(nodeset.nodeNr); i++ {
		ret[i] = uintptr(unsafe.Pointer(nodes[i]))
	}

	return ret, nil
}

func XMLTextData(n PtrSource) string {
	nptr, err := validNodePtr(n)
	if err != nil {
		return ""
	}
	return xmlCharToString(nptr.content)
}

func XMLSchemaParse(buf []byte, options ...option.Interface) (uintptr, error) {
	var uri string
	var encoding string
	var coptions int
	for _, opt := range options {
		switch opt.Name() {
		case option.OptKeyWithURI:
			uri = opt.Value().(string)
		}
	}

	docctx := C.xmlCreateMemoryParserCtxt((*C.char)(unsafe.Pointer(&buf[0])), C.int(len(buf)))
	if docctx == nil {
		return 0, errors.New("error creating doc parser")
	}

	var curi *C.char
	if uri != "" {
		curi = C.CString(uri)
		defer C.free(unsafe.Pointer(curi))
	}

	var cencoding *C.char
	if encoding != "" {
		cencoding = C.CString(encoding)
		defer C.free(unsafe.Pointer(cencoding))
	}

	doc := C.xmlCtxtReadMemory(docctx, (*C.char)(unsafe.Pointer(&buf[0])), C.int(len(buf)), curi, cencoding, C.int(coptions))
	if doc == nil {
		return 0, errors.Errorf("failed to read schema from memory: %v",
			xmlCtxtLastErrorRaw(uintptr(unsafe.Pointer(docctx))))
	}

	parserCtx := C.xmlSchemaNewDocParserCtxt((*C.xmlDoc)(unsafe.Pointer(doc)))
	if parserCtx == nil {
		return 0, errors.New("failed to create parser")
	}
	defer C.xmlSchemaFreeParserCtxt(parserCtx)

	s := C.xmlSchemaParse(parserCtx)
	if s == nil {
		return 0, errors.New("failed to parse schema")
	}

	return uintptr(unsafe.Pointer(s)), nil
}

type SchemaValidationError struct {
	Message string
	Line    int
}

func (e SchemaValidationError) Error() string {
	return e.Message
}

type SchemaValidationResult struct {
	Errors     []error
	ErrorCount int
}

// TODO improve the returned result
func XMLSchemaValidateDocument(schema PtrSource, document PtrSource, options ...int) (res SchemaValidationResult) {
	sptr, err := validSchemaPtr(schema)
	if err != nil {
		res.Errors = []error{err}
		res.ErrorCount = 1
		return
	}

	dptr, err := validDocumentPtr(document)
	if err != nil {
		res.Errors = []error{err}
		res.ErrorCount = 1
		return
	}

	ctx := C.xmlSchemaNewValidCtxt(sptr)
	if ctx == nil {
		res.Errors = []error{errors.New("failed to build validator")}
		res.ErrorCount = 1
		return
	}
	defer C.xmlSchemaFreeValidCtxt(ctx)

	accum := C.setValidityFunc(ctx)
	defer C.freeValidationResult(accum)

	for _, option := range options {
		C.xmlSchemaSetValidOptions(ctx, C.int(option))
	}

	if C.xmlSchemaValidateDoc(ctx, dptr) == 0 {
		return
	}

	errs := make([]error, accum.index)
	for i := 0; i < int(accum.index); i++ {
		err := accum.errors[i]
		errs[i] = SchemaValidationError{
			Message: strings.TrimSpace(C.GoString(err.message)),
			Line:    int(err.line),
		}
	}

	res.Errors = errs
	res.ErrorCount = int(accum.count)

	return
}

func validSchemaPtr(schema PtrSource) (*C.xmlSchema, error) {
	if schema == nil {
		return nil, ErrInvalidSchema
	}
	sptr := schema.Pointer()
	if sptr == 0 {
		return nil, ErrInvalidSchema
	}

	return (*C.xmlSchema)(unsafe.Pointer(sptr)), nil
}

func XMLSchemaFree(s PtrSource) error {
	sptr, err := validSchemaPtr(s)
	if err != nil {
		return err
	}

	C.xmlSchemaFree(sptr)
	return nil
}

func XMLCtxtReadMemory(ctx PtrSource, file string, baseURL string, encoding string, options int) (uintptr, error) {
	ctxptr, err := validParserCtxtPtr(ctx)
	if err != nil {
		return 0, errors.Wrap(err, "not a valid pointer")
	}

	var cfile, cbaseURL, cencoding *C.char
	if file != "" {
		cfile = C.CString(file)
		defer C.free(unsafe.Pointer(cfile))
	}

	if baseURL != "" {
		cbaseURL = C.CString(baseURL)
		defer C.free(unsafe.Pointer(cbaseURL))
	}

	if encoding != "" {
		cencoding = C.CString(encoding)
		defer C.free(unsafe.Pointer(cencoding))
	}

	doc := C.xmlCtxtReadMemory(ctxptr, cfile, C.int(len(file)), cbaseURL, cencoding, C.int(options))
	if doc == nil {
		return 0, errors.Errorf("failed to read document from memory: %v", xmlCtxtLastError(ctx))
	}
	return uintptr(unsafe.Pointer(doc)), nil
}
