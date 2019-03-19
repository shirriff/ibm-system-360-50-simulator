from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import SimpleHTTPServer
import cgi
import anydbm
import re
import traceback
import urlparse

class Handler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_POST(s):
        print 'POST'
        ctype, pdict = cgi.parse_header(s.headers.getheader('content-type'))
	print ctype, pdict
        if ctype == 'multipart/form-data':
            postvars = cgi.parse_multipart(s.rfile, pdict)
        elif ctype == 'application/x-www-form-urlencoded':
            length = int(s.headers.getheader('content-length'))
	    print length
            postvars = cgi.parse_qs(s.rfile.read(length), keep_blank_values=1)
	    print postvars
        else:
            postvars = {}
        print 'POST', postvars
        s.send_response(200)
        s.send_header("Content-type", "text/text")
        s.end_headers()
        s.wfile.write("success!!")
	s.wfile.write(repr(postvars))
	s.wfile.write(ctype)
        
server = HTTPServer(('', 4444), Handler)
print 'serving on 4444'
server.serve_forever()
