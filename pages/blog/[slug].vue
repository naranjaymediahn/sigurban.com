<template>
  <BlogPost :slug="String(route.params.slug)" />
</template>

<script setup>
const route = useRoute()
</script>
