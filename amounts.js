function recipeStep(recipe,step) {
  return t(step).replace(/\[\[([^\]]+)\]\]/g,(_,spec)=>{
    const [name,group,multiplier]=spec.split('~');
    const item=recipe.ingredients.find(row=>row[1]===name && (!group || row[0]===group));
    return measure(portion(recipe,item)*Number(multiplier||1),item[3]);
  });
}
