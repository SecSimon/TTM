export class StringExtension {
  public static FindUniqueName(name: string, database: string[]): string {
    let isNumber = (str: string): boolean => {
      if (!str) return false;
      for (let i = 0; i < str?.length; i++) { if (!(str[i] >= '0' && str[i] <= '9')) return false; }
      return true;
    };
    const similar = database.filter(x => x.startsWith(name));
    const existing = similar.filter(x => isNumber(x[name.length])).map(x => x.replace('-Reference', ''));
    const nums = existing.map(x => Number(x.replace(name, '')));
    if (nums.length == 0) {
      if (similar.length == 0 || (similar.length == 1 && similar[0] != name)) return name;
      return name + '2';
    }
    return name + (Math.max(...nums)+1).toString();
  }

  public static GetNumber(val: string): string {
    let res = '';
    for (let i = val.length-1; i >= 0; i--) {
      if (val[i] >= '0' && val[i] <= '9') res = val[i] + res;
      else break;
    }
    return res;
  }

  public static FromCamelCase(val: string): string {
    if (val.length == 0) return '';
    let res = val[0];
    for (let i = 1; i < val.length; i++) {
      let curr = val[i];
      let last = val[i-1];
      if (curr >= 'A' && curr <= 'Z' && ((last >= 'a' && last <= 'z') || (last >= '0' && last <= '9'))) {
        res = res + ' ';
      }
      
      res = res + curr;
    }
    return res;
  }

  public static Format(val: string, ...replacements: string[]): string {
    return val.replace(/{(\d+)}/g, (match, number) => {
      return typeof replacements[number] != 'undefined' ? replacements[number] : match;
    });
  }

  public static NullOrEmpty(val: string) {
    return val == null || val == '';
  }
}