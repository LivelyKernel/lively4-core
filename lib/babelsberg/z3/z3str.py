#!/usr/bin/env python


import sys
import getopt
import time
import os
import subprocess

# "solver" should point to the binary built.
# e.g. "/home/z3-str/str"
solver = os.path.join(os.path.abspath(os.path.dirname(__file__)), "str_static")

#===================================================================

def encodeConstStr(constStr):
  constStr = constStr.replace(' ', '_aScIi_040')
  constStr = constStr.replace('\\\"', '_aScIi_042')
  constStr = constStr.replace('#', '_aScIi_043')
  constStr = constStr.replace('$', '_aScIi_044')
  constStr = constStr.replace('\'', '_aScIi_047')
  constStr = constStr.replace('(', '_aScIi_050')
  constStr = constStr.replace(')', '_aScIi_051')
  constStr = constStr.replace(',', '_aScIi_054')
  constStr = constStr.replace(':', '_aScIi_072')
  constStr = constStr.replace(';', '_aScIi_073')
  constStr = constStr.replace('[', '_aScIi_133')
  constStr = constStr.replace(']', '_aScIi_135')
  constStr = constStr.replace('\\\\', '_aScIi_134')
  constStr = constStr.replace('{', '_aScIi_173')
  constStr = constStr.replace('}', '_aScIi_175')
  constStr = constStr.replace('|', '_aScIi_174')
  constStr = constStr.replace('`', '_aScIi_140')
  constStr = constStr.replace('\\t', '_aScIi_011')
  constStr = constStr.replace('\\n', '_aScIi_012')
  return constStr



def convert(org_file):
  absPath = os.path.dirname(os.path.abspath(org_file));
  convertDir = absPath + "/convert";
  if not os.path.exists(convertDir):
     os.makedirs(convertDir)

  fileName = os.path.basename(org_file);
  new_file = os.path.join(convertDir, fileName)

  f_o = open(org_file, 'r')
  f_n = open(new_file, 'w')

  declared_string_var = []
  declared_string_const = []
  converted_cstr = ""

  linesInFile = f_o.readlines()

  output_str = ""

  for line in linesInFile:
    line = line.strip();
    if line == "":
      continue
    if line.startswith(';'):
      output_str += line + "\n"
      continue
    if line.startswith('%'):
      output_str += line + "\n"
      continue
    if line.startswith('//'):
      output_str += line + "\n"
      continue
    if line.find("get-model") != -1:
      # output_str += line + "\n"
      continue
    if line.find("get-value") != -1:
      # output_str += line + "\n"
      continue
    if line.find("set-option") != -1:
      output_str += line + "\n"
      continue
    if line.find("declare-variable") != -1:
      declared_string_var.append(line.replace('declare-variable', 'declare-const'))
      continue

    # -----------------------------
    # start: processing const string
    p1 = -1
    while True:
      p1 = line.find('\"', p1 + 1);
      if p1 == -1:
        break;

      # exclude the case "str\"str\"str"
      p2 = line.find('\"', p1 + 1)
      while (not (p2 == -1)) and (not line[p2 - 2] == '\\') and line[p2 - 1] == '\\' and line[p2] == '\"':
        p2 = line.find('\"', p2 + 1)

      if p2 == -1:
        print('input format error!\n')
        return "eRrOr"

      old_s = line[p1: p2 + 1]
      encoded_s = encodeConstStr( old_s[1 : len(old_s) - 1] )
      line = line.replace(old_s, '__cOnStStR_' + encoded_s)

      if encoded_s not in declared_string_const:
        declared_string_const.append(encoded_s)
      p1 = p2
    # -----------------------------
    # end: processing const string
    converted_cstr = converted_cstr + line + '\n'

  for strv in declared_string_var:
    output_str = output_str + strv + "\n"
  output_str = output_str + '\n'
  for str_const in declared_string_const:
    output_str = output_str + '(declare-const __cOnStStR_' + str_const + ' String)\n'
  output_str = output_str + '\n'
  output_str = output_str + converted_cstr
  print output_str
  f_n.write(output_str)
  f_n.close()
  f_o.close()
  return new_file



def processOutput(output):
  if output.find("(error \"line") >= 0:
    res = ''
    lines = output.split("\n")
    for line in lines:
      if line.startswith('(error '):
        res = res + line + "\n"
    return res

  output = output.replace("\t", "\\t")
  lines = output.split("\n")
  result = ""
  for line in lines:
    line = line.lstrip(' ');
    line = line.replace("\n", "\\n")
    #skip intermediated variable solutions
    if line.startswith('_t_'):
      continue
    result = result + line + "\n"
  return result



def printUseage():
  print 'USAGE: '
  print '  Z3-str.py -f <inputfile> [OPTIONS]\n'
  print 'OPTIONS:'
  print '  -l <freeVarMaxLen>    Define length upper bound for free variables'
  print '                        A free variable refers to a variable whose value'
  print '                        is not bounded, e.g, Z = X Y "abc" /\ X = M "efg"'
  print '                        Only Y and M are free variables.'
  print '                        <freeVarMaxLen> should be a positive integer.'
  print '                        If not provided, DEFAULT value is 7'
  print ''
  print '  -p                    [Experimental]'
  print '                        Allow self-cut (or loop inducing cut).'
  print '                          ** WARNING: it may not be terminated if allowing self-cut'
  print '                        Avoid self-cut is the DEFAULT behavior (no "-p")'
  print '\n'



if __name__ == '__main__':
  if not os.path.exists(solver):
    print "Error: No Z3-str binary found @ \"" + solver + "\"."
    exit(0)

  argv = sys.argv[1:]
  inputFile = '';
  freeVarMaxLen = 7;
  allowLoopCut = 0;

  try:
    opts, args = getopt.getopt(argv,"hpf:l:")
  except getopt.GetoptError:
    printUseage()
    sys.exit()
  for opt, arg in opts:
    if opt == '-h':
      printUseage()
      sys.exit()
    elif opt == '-p':
      allowLoopCut = 1
    elif opt in ("-f"):
      inputFile = arg
    elif opt in ("-l"):
      try:
        freeVarMaxLen = int(arg)
        if freeVarMaxLen < 1:
          print 'Error: "-l <freeVarMaxLen>"'
          print '       <freeVarMaxLen> should be a positive integer'
          sys.exit()
      except ValueError:
        print 'Error: "-l <freeVarMaxLen>"'
        print '       <freeVarMaxLen> should be a positive integer'
        sys.exit()


  if inputFile == '':
    printUseage()
    sys.exit()

  if not os.path.exists(inputFile):
    print "Error: Input file does not exist: \"" + inputFile + "\""
    exit(0)


  convertedFile = convert(inputFile)
  if convertedFile == "eRrOr":
    exit(0)

  try:
    start = time.time()
    freeVarMaxLenStr = "%d"%freeVarMaxLen
    paras = []
    if allowLoopCut == 0:
      paras = [solver, "-f", convertedFile, "-l", freeVarMaxLenStr]
    else:
      paras = [solver, "-f", convertedFile, "-l", freeVarMaxLenStr, "-p"]

    err = subprocess.check_output(paras, );
    eclapse = (time.time() - start)
    outStr = processOutput(err)
    sys.stdout.write(outStr)
  except KeyboardInterrupt:
    print "Interrupted by keyborad";

  os.remove(convertedFile)
