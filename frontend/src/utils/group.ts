export function roomIdFor(ids: string[]): string {
    return ids.sort().join('-');          //   a-b-c  ===  c-b-a  === same room
  }
  
  export function sameGroup(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const s1 = new Set(a);
    return b.every(id => s1.has(id));
  }