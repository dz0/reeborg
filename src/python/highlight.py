# Inspired from https://code.google.com/p/pseudo-pdb/ by Jurgis Pralgauskis
# However, bearing very little resemblance to the above
#
# MIT license like the rest of Reeborg's World code.
# André Roberge


def extract_first_word(mystr, separators):
    """ Splits a string into 2 parts without using regexp
        and return the first part (before a known word separator)
    """
    for i, char in enumerate(mystr):
        if char in separators:
            return mystr[:i], mystr[i:]
    return mystr, ''


def tracing_line(indent, lineno, frame=False):
    '''Construct the tracing line'''
    tracecall_name = 'RUR.set_lineno_highlight'
    if frame:
        return indent + tracecall_name +  '(%d, frame=True)'%lineno
    else:
        return indent + tracecall_name +  '(%d)'%lineno


def insert_highlight_info(src):
    src = src.replace('\t', '    ')  # standard tab spacing - just in case they are used
    lines = src.split("\n")
    new_lines = []
    use_next_indent = False
    saved_lineno = None

    for lineno, line in enumerate(lines):
        if not line.strip():
            new_lines.append(line)
            continue

        line_wo_indent = line.lstrip()
        indent = line[:-len(line_wo_indent)]
        first_word, remaining = extract_first_word(line_wo_indent, ' #=([{:\'"\\')

        if use_next_indent:
            new_lines.append(tracing_line(indent, saved_lineno, frame=True))
            use_next_indent = False

        if first_word in 'pass def class continue break if from import del return raise try with yield'.split():
            new_lines.append(tracing_line(indent, lineno, frame=True))
            new_lines.append(line)
        elif first_word in 'for while'.split():
            new_lines.append(tracing_line(indent, lineno, frame=True))
            new_lines.append(line)
            use_next_indent = True
            saved_lineno = lineno
        elif first_word in 'else except finally'.split():
            new_lines.append(line)
            use_next_indent = True
            saved_lineno = lineno
        elif first_word == 'elif':
            new_lines.append( indent + first_word + tracing_line(' ', lineno, frame=True) + ' and' + remaining)
        elif '=' in line_wo_indent:
            new_lines.append(tracing_line(indent, lineno, frame=True))
            new_lines.append(line)
        elif not first_word and remaining[0] == "#":
            new_lines.append(line)
        else:
            new_lines.append(tracing_line(indent, lineno))
            new_lines.append(line)

    return '\n'.join(new_lines)


# if __name__ == '__main__':
#     import test_highlight as src

#     result = insert_highlight_info(src.test_single_move)
#     print(result)
#     print("\n", result==src.test_single_move_result)
