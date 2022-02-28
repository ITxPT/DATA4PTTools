package logger

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"golang.org/x/term"
)

const (
	Escape      = 0x1b
	LeftBracket = 0x5b
	One         = 0x31
	Two         = 0x32
	Clear       = 0x4b
	MoveLeft    = 0x44
	MoveUp      = 0x41
)

var defaultTerminalOutput = &TerminalOutput{
	firstDraw:     true,
	defaultBuffer: "_default",
	buffers:       map[string]*buffer{},
	format:        LogFormatPlain,
}

func clearLine()     { fmt.Printf("%c%c%c%c", Escape, LeftBracket, Two, Clear) }
func moveUp()        { fmt.Printf("%c%c%c%c", Escape, LeftBracket, One, MoveUp) }
func moveLeft(n int) { fmt.Printf("%c%c%d%c", Escape, LeftBracket, n, MoveLeft) }

type buffer struct {
	sync.Mutex
	data []string
	size int
}

func (b *buffer) Add(v string) {
	b.Lock()
	defer b.Unlock()

	b.data = append(b.data, v)
	if len(b.data) > b.size {
		b.data = b.data[1:]
	}
}

func (b *buffer) Fill(v string) {
	b.Lock()
	defer b.Unlock()

	for i := 0; i < b.size; i++ {
		b.data = append(b.data, v)
	}
}

type TerminalOutput struct {
	sync.Mutex

	format        LogFormat
	firstDraw     bool
	defaultBuffer string
	buffers       map[string]*buffer
	started       bool
	lastUpdate    time.Time
	lastRender    time.Time
}

func (o *TerminalOutput) AddBuffer(name string, size int) {
	o.Lock()
	defer o.Unlock()
	o.buffers[name] = &buffer{size: size}
	o.buffers[name].Fill("")
}

func (o *TerminalOutput) SetDefaultBuffer(name string) {
	o.defaultBuffer = name
}

func (o *TerminalOutput) SetFormat(format LogFormat) {
	o.format = format
}

func (o *TerminalOutput) Draw() {
	if o.started {
		return
	}

	o.started = true

	go func() {
		for {
			if o.lastUpdate.Before(o.lastRender) {
				time.Sleep(time.Millisecond * 300)
				continue
			}

			o.Lock()
			w, _, _ := term.GetSize(0)
			size := 0
			for _, buf := range o.buffers {
				size = size + buf.size
			}

			if o.firstDraw {
				o.firstDraw = false
			} else {
				clearLine()
				for n := 1; n < size; n++ {
					moveUp()
					clearLine()
				}
				moveLeft(1000)
			}

			rows := []string{}
			names := []string{}
			for k, _ := range o.buffers {
				names = append(names, k)
			}
			sort.SliceStable(names, func(i, j int) bool { return names[i] < names[j] })

			if w <= 0 {
				for _, k := range names {
					rows = append(rows, o.buffers[k].data...)
				}

				fmt.Printf(strings.Join(rows, "\n"))
				return
			} else {
				for _, k := range names {
					buf := o.buffers[k]
					for _, r := range buf.data {
						if w > 0 && len(r) > w {
							rows = append(rows, r[:len(r)-(len(r)-w)-4]+" ...")
						} else {
							rows = append(rows, r)
						}
					}
				}
			}

			o.Unlock()
			fmt.Printf(strings.Join(rows, "\n"))
			o.lastRender = time.Now()
			time.Sleep(time.Millisecond * 300)
		}
	}()
}

func (o *TerminalOutput) Log(entry LogEntry) {
	o.Lock()
	defer o.Unlock()

	if buf := o.buffers[o.defaultBuffer]; buf != nil {
		buf.Add(entry.Format(o.format))
	}

	o.lastUpdate = time.Now()
	o.Draw()
}

func (o *TerminalOutput) LogTo(dst string, entry LogEntry) {
	o.Lock()
	defer o.Unlock()

	if buf := o.buffers[dst]; buf != nil {
		buf.Add(entry.Format(LogFormatNone))
	}

	o.lastUpdate = time.Now()
	o.Draw()
}

func DefaultTerminalOutput() *TerminalOutput { return defaultTerminalOutput }
