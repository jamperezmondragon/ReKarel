// This file was generated by lezer-generator. You probably shouldn't edit it.
import {LRParser} from "@lezer/lr"
const spec_Identifier = {__proto__:null,"iniciar-programa":42, "inicia-ejecucion":44, mientras:58, hacer:60, repetir:64, veces:66, si:70, entonces:72, inicio:74, fin:76, "termina-ejecucion":80, "finalizar-programa":82}
export const parser = LRParser.deserialize({
  version: 14,
  states: "'UOVQPOOOOQO'#C^'#C^O[QPOOOOQO'#Ca'#CaOaQPO'#C`OrQPOOOwQPO'#CuOOQO'#Cc'#CcOOQO'#Ce'#CeOOQO'#Cg'#CgO!VQPO'#CiOOQO'#Ct'#CtOOQO'#Cs'#CsO!^QPO,58zO!fQPO'#CxO!kQPO'#C{O!pQPO'#DOOOQO'#Cj'#CjOOQO'#Cm'#CmQOQPOOO!uQPO,59aOOQO,59T,59TO!zQPO,59TOOQO'#Ck'#CkO#SQPO,59_OOQO'#Cl'#ClOOQO1G.f1G.fO#aQPO,59dO#fQPO,59gO#kQPO,59jO#pQPO1G.{OOQO1G.o1G.oOOQO1G.y1G.yO#uQPO1G/OO#zQPO1G/ROOQO'#Ch'#ChOaQPO1G/UOOQO7+$g7+$gO$PQPO7+$jO$UQPO7+$mOOQO7+$p7+$pOOQO'#Cd'#CdOaQPO<<HUOOQO'#Cf'#CfOaQPO<<HXOOQOAN=pAN=pOOQOAN=sAN=s",
  stateData: "$Z~OdOS~OePO~OfRO~ORUOmVOpWOsXOuaO~OybO~OjdOwiXxiXviX~OvgO~PaOwhOxiO~OjkO~OjlO~ORmO~OUnO~OvgOwhO~Owgaxgavga~PaORqO~OUrO~OtsO~OkuO~OkvO~OkwO~OnyO~Oq{O~O",
  goto: "#tsPPtPwzP}!V!Y!b!e!m!p!x#Q#W#ZPPPPP#^#d!pPP!pPP!pPP!pRQORTQRSQ]^SYhtz|Rzv]_SYhtz|R|w]`SYhtz|Rtm]ZSYhtz|]YSYhtz|QeYRofRj]RcTQ]SRfYS[SYQphQxtQ}zR!O|",
  nodeNames: "⚠ Script StartProgram Identifier Execution StartExecution Number While Do Iterate Times If Then Block Begin End EndExecution EndProgram",
  maxTerm: 41,
  nodeProps: [
    ["closedBy", 14,"End"],
    ["openedBy", 15,"Begin"]
  ],
  skippedNodes: [0],
  repeatNodeCount: 0,
  tokenData: "$[~RdX^!apq!axy#Uyz#Z!Q![#`!]!^#h!c!}#m#R#S#m#T#o#m#y#z!a$f$g!a%W%o#m%p&a#m&b&j#m#BY#BZ!a$IS$I_!a$I|$JO!a$JT$JU!a$KV$KW!a&FU&FV!a~!fYd~X^!apq!a#y#z!a$f$g!a#BY#BZ!a$IS$I_!a$I|$JO!a$JT$JU!a$KV$KW!a&FU&FV!a~#ZOj~~#`Ok~~#ePU~!Q![#`~#mOw~~#rWR~}!O#m!Q![#m!c!}#m#R#S#m#T#o#m%W%o#m%p&a#m&b&j#m",
  tokenizers: [0],
  topRules: {"Script":[0,1]},
  specialized: [{term: 3, get: value => spec_Identifier[value] || -1}],
  tokenPrec: 0
})
